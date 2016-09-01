// Things related to serving traffic to code editors.
// This file defines the API between ai.codes local server and code editor.

// For now the simple API is:
//    GET localserver:CODES/<ice_id>/JavaClassName
// The response would be the probablity of each method called.

// Future plans:
//  1. investigate and use a better Web framework to serve traffic;
//  2. revise the API as we add more features.

const http = require('http');

function createServer(content, cache) {
  function handler(request, response) {
    if (request.url === '/favicon.ico') {
      response.end('');
      return;
    }

    const res = request.url.substring(1).split('/');
    if (res.length !== 2) {
      response.end('Not a valid URL');
      return;
    }

    const iceId = res[0];
    const className = res[1];
    const context = className;

    let extension = {
      '.expiresIn': 1,    // default cache TTL for cold lookup: 1s
    };

    // Hack, for internal beta users.
    if (className.startsWith('com.fitbit')) {
      content.send('ice-display', iceId,
        'JVM method auto-complete', // intention
        context,
        'No extensions per privacy policy');
      extension = {};
    } else if (cache.has(className)) {
      extension = cache.get(className);
      // TODO(exu): seam. from cache we combine context to generate extension.
      content.send('ice-display', iceId,
        'JVM method auto-complete',
        context,
        extension);
    } else {
      content.send('ice-lookup', iceId,
        'JVM method auto-complete',
        className);
    }
    response.writeHead(200, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify(extension));
  }

  return http.createServer(handler);
}

export default createServer;
