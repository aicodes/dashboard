// Takes care of communication with ai.codes server.
const http = require('http');

function fetchMethodUsage(className, callback) {
  const url = `http://api.ai.codes/jvm/usage/${className}`;
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

export {
  fetchMethodUsage as default,
};
