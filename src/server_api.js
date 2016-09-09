// Takes care of communication with ai.codes server.
const https = require('https');

function getJson(url, callback) {
    https.get(url, (response) => {
        let body = '';
        response.on('data', (d) => {
            body += d;
        });
        response.on('end', () => {
            const parsed = JSON.parse(body);
            callback(parsed);
        });
    });
}

function fetchMethodUsage(className, callback) {
    const url = `https://api.ai.codes/jvm/v1/${className}`;
    getJson(url, callback);
}

function fetchSimilarity(className, contextName, callback) {
    const url = `https://api.ai.codes/jvm/v1/${className}?c=${contextName}`;
    getJson(url, callback);
}

export {
    fetchMethodUsage as fetchMethodUsage,
    fetchSimilarity as fetchSimilarity,
};
