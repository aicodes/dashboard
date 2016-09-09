/**
 * Owned by the electron main process. This module defines communication protocol between code
 * editors and ai.codes local server. Implemented as an express server.
 *
 * Two types of requests are supported.
 *
 * 1. Request:
 *          GET     /usage/<ice_id>/ClassName
 *    Response:
 *          key value JSON object, Key is method name (short), and value be the probability
 *          of the method call (usage frequency).
 *
 * 2. Request:
 *          GET    /similarity/<ice_id>/<context-string>/ClassName
 *    Response:
 *          key value JSON object. Key is the method name (short), value is the similarity to the context name.
 *
 * Both types of requests are "async", meaning if local server does not have it, it would immediately return
 * HTTP 202 Accepted. Clients are responsible to query the API again later.
 */

import express from 'express';

function createExpressServer(content, server_cache) {
    const app = express();

    // ---------- V 0.2 API ----------------
    // ---------- For MVP, not optimized for performance

    // TWO-IN-ONE API call. Editor gives local server a heads up.
    // In future it will split into two endpoints,
    //  1) notifying intention as the start of an auto-complete group.
    //  2) notifying potential similarity queries coming up (
    //  will be implemented as an editor event notification)
    app.get('/ice/:ice/:context/:items', (req, res) => {
        const iceId = req.params['ice'];
        const context = req.params['context'];
        const items = req.params['items'].split(',');

        content.send('ice-updateContext', iceId, context);

        for (let item of items) {
            const key = context + ':' + item;
            if (!server_cache.has(key)) {
                content.send('relevance-lookup', context, items);
            }
        }
        res.status(201).end('Request Accepted');
    });

    app.get('/ping/:method_name', (req, res) => {
        const methodName = req.params['method_name'];

        console.log(methodName);

        const l = methodName.split("&");
        const keyMethod = l[0];
        const intention = {};
        intention['method'] = keyMethod;
        intention['stanza'] = [];
        for (let i = 1; i < l.length; ++i) {
            intention['stanza'].push(l[i].split('+').join(' '));
        }
        content.send('ice-update-intention', intention);
        res.status(204).end();
    });


    // -------- Real API -----

    app.get('/similarity/:contextId/:className/:outerMethod', (req, res) => {
        const contextId = req.params['contextId'];
        const className = req.params['className'];
        const outerMethod = req.params['outerMethod'];

        let result = {
            'header': {
                'status': 200
            },
            'response': {}// default cache TTL for cold lookup: 1s
        };

        const cache_key = outerMethod + ':' + className;
        if (server_cache.has(cache_key)) {
            result['response'] = server_cache.get(cache_key);
            content.send('ice-display', contextId, className, result['response']);
        } else {
            content.send('similarity-lookup', contextId, className, outerMethod, cache_key);
        }
        res.json(result);
    });

    // ----------V 0.1 API just for method usage ----------//
    app.get('/usage/:contextId/:className', (req, res) => {
        const contextId = req.params['contextId'];
        const className = req.params['className'];

        let result = {
            'header': {
                'status': 200
            },
            'response': {}// default cache TTL for cold lookup: 1s
        };
        if (server_cache.has(className)) {
            result['response'] = server_cache.get(className);

            content.send('ice-display', contextId, className, result['response']);
        } else {
            content.send('usage-lookup', contextId, className);
        }
        res.json(result);
    });

    // The annoying favicon when we use browser to poke the end point.
    app.get('/favicon.ico', (req, res) => {
        res.end('');
    });

    return app;
}

export default createExpressServer;
