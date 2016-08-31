"use strict";

var http = require('http');

function create_server(content, cache) {
    function handler(request, response) {
        if (request.url == '/favicon.ico') {
            response.end('');
            return;
        }

        var res = request.url.substring(1).split('/');
        if (res.length != 2) {
            response.end("Not a valid URL");
            return;
        }

        var iceId = res[0];
        var className = res[1];

        var result = {
            '.expiresIn': 1,    // default cache TTL for cold lookup: 1s
        };

        if (className.startsWith("com.fitbit")) {
            content.send('ice-display', iceId, "JVM method auto-complete", className, 'No extensions per privacy policy');
            result = {};
        } else {
            console.log("check if cache has \'" + className + "\'");
            if (cache.has(className)) {
                result = cache.get(className);
                content.send("ice-display", iceId, "JVM method auto-complete", className, result);
            } else {
                content.send("ice-lookup", iceId, "JVM method auto-complete", className);
            }
        }
        response.writeHead(200, {"Content-Type": "application/json"});
        response.end(JSON.stringify(result));   // has to be a string or buffer...
    }

    return http.createServer(handler);
}

export default create_server;
