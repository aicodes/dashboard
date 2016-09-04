// Takes care of communication with ai.codes server.
const http = require('http');

function getJson(url, callback) {
    http.get(url, (response) => {
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
  const url = `http://api.ai.codes/jvm/usage/${className}`;
  getJson(url, callback);
}

function fetchSimilarity(contextName, query, callback) {
    const url = `http://api.ai.codes/jvm/similarity/${contextName}/${query}`;
    getJson(url, callback);
}

export {
    fetchMethodUsage as fetchMethodUsage,
    fetchSimilarity as fetchSimilarity,
};
