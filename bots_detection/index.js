// const axios = require('axios')
// const url = 'http://checkip.amazonaws.com/';
let response;

/**
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Context doc: https://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-context.html
 * @param {Object} context
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 *
 */

module.exports.handler = async (event, context) => {
    const request = event.Records[0].cf.request;
    const headers = request.headers;
    const user_agent = headers['user-agent'];
    const host = headers['host'];
    if (user_agent && host) {
        var prerender = /googlebot|adsbot\-google|WhatsApp|Feedfetcher\-Google|bingbot|yandex|baiduspider|Facebot|facebookexternalhit|twitterbot|rogerbot|linkedinbot|embedly|quora link preview|showyoubot|outbrain|pinterest|slackbot|vkShare|W3C_Validator/i.test(user_agent[0].value);
        prerender = prerender || /_escaped_fragment_/.test(request.querystring);
        prerender = prerender && !/\.(js|css|xml|less|png|jpg|jpeg|gif|pdf|doc|txt|ico|rss|zip|mp3|rar|exe|wmv|doc|avi|ppt|mpg|mpeg|tif|wav|mov|psd|ai|xls|mp4|m4a|swf|dat|dmg|iso|flv|m4v|torrent|ttf|woff|svg|eot)$/i.test(request.uri);
        if (prerender) {
            headers['x-prerender-host'] = [{key: 'X-Prerender-Host', value: host[0].value}];
            headers['x-user-agent'] = [{key: 'X-User-Agent', value: user_agent[0].value}];
        }
    }
    return request;

}

