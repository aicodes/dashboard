// Takes care of communication with ai.codes server.
const https = require('https');
const request = require('request');

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
  const url = `https://api.ai.codes/jvm/v2/class/${className}`;
  getJson(url, callback);
}

function fetchSimilarity(className, outerMethod, callback) {
  const url = `https://api.ai.codes/jvm/v2/class/${className}?c=${outerMethod}`;
  getJson(url, callback);
}

function fetchSnippets(query, callback, err) {
  const url = `https://api.ai.codes/jvm/v2/snippet?q=${query}`;
  request(url, (error, response, body) => {
    if (!error && response.statusCode === 200) {
      callback(JSON.parse(body).snippets);
    } else {
      err(error);
    }
  });
}

export {
    fetchMethodUsage,
    fetchSimilarity,
    fetchSnippets,
};
