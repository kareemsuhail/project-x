'use strict';
const chromium = require('chrome-aws-lambda');
const puppeteer = chromium.puppeteer;
const AWS = require('aws-sdk');
const http = require('http');

AWS.config.update({
    region: "us-east-1",
});
const cache = new AWS.S3();
module.exports.handler = async (event, context) => {
    const request = event.Records[0].cf.request;
    if (!request.headers['x-prerender-host']) {
        return request;
    }
    event["statusCode"] = 200
    const path = request['uri']
    var cache_key = path.replace(/\//g, "-");
    cache_key = cache_key.replace("+/g", "-");

    const bucketName = 'sam-x-cache-2';
    const getParams = {
        Bucket: bucketName,
        Key: cache_key
    };
    let html = null;
    try {

        var file = await cache.getObject(getParams).promise();
        const week = 1000 * 60 * 60 * 24 * 7;
        if (((new Date) - file.LastModified) > week) {
            const response = await render_and_respond(path, cache_key, bucketName);
            event["statusCode"] = response.statusCode
            return response;
        }

        html = file.Body.toString('utf-8');
        event["statusCode"] = 200
        return {
            status: 200,
            body: html,
            headers: [{
                'content-type': {
                    key: 'Content-Type',
                    value: "text/html"
                },
            }]
        };

    } catch (error) {

        const response = await render_and_respond(path, cache_key, bucketName);
        event["statusCode"] = response.statusCode
        return response;

    }


};

const render_and_respond = async (path, cache_key, bucketName) => {
    let browser = null;
    try {
        browser = await puppeteer.launch({
            defaultViewport: {width: 1024, height: 800},
            headless: false,
            executablePath: await chromium.executablePath,
            args: chromium.args,
        });
        const base_url = "https://<base_url>";
        const page = await browser.newPage();
        await page.goto(base_url + path, {
            waitUntil: ['domcontentloaded', 'networkidle0'],
        });
        const html = await page.content(); // serialized HTML of page DOM.
        await cache.putObject({
            Bucket: 'sam-x-cache-2',
            Key: cache_key,
            Body: html
        }).promise();
        return {
            status: 200,
            body: html,
             headers: [{
                'content-type': {
                    key: 'Content-Type',
                    value: "text/html"
                },
            }]
        };

    } catch (error) {
        console.log(error)
        return {
            status: 500
        };
    } finally {
        if (browser)
            await browser.close();
    }
};
