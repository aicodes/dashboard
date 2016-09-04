// This file defines the API between ai.codes local server and code editors.

// For now we support two simple API methods:
//   *  GET localserver:CODES/<ice_id>/JavaClassName
//      response:
//          key value JSON objects where key is method name defined under the class, and value be the probability
//          of the method call.

//   *  GET localserver:CODES/relevance/<ice_id>/<context-string>/ListOfJavaClassOrMethodNames
//      response:
//          key value JSON objects. Key is the query key, value is the similarity to the context name.


//   *  GET localserver:CODES/quiet_fetch/<context-string>/ListOfClassOrMethods
//        response: 202 Accepted
import cache from './simple_cache';
import express from 'express';

const DEFAULT_WEIGHT = 0.05;

function createExpressServer(content) {
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

        content.send('ice-update', iceId, context);

        for (let item of items) {
            const key = context + ':' + item;
            if (!cache.has(key)) {
                content.send('relevance-lookup', context, items);
            }
        }
        res.status(202).end('Request Accepted');
    });

    app.get('/relevance/:ice/:context/:items', (req, res) => {
        const context = req.params['context'];

        const items = req.params['items'].split(',');
        const json = {};
        json['context'] = context;
        const relevance = {};

        for (let item of items) {
            const key = context + ':' + item;
            if (cache.has(key)) {
                relevance[item] = cache.get(key);
            } else {
                relevance[item] = DEFAULT_WEIGHT;
            }
        }
        json['relevance'] = relevance;
        res.json(json);
    });

    // ----------V 0.1 API just for method usage ----------//
    app.get('/:ice/:className', (req, res) => {
        const iceId = req.params['ice'];
        const className = req.params['className'];
        const context = className;

        let extension = {
            '.expiresIn': 1,    // default cache TTL for cold lookup: 1s
        };

        if (cache.has(className)) {
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
        res.json(extension);
    });

    // The annoying favicon when we use browser to poke the end point.
    app.get('/favicon.ico', (req, res) => {
        res.end('');
    });

    return app;
}

export default createExpressServer;
