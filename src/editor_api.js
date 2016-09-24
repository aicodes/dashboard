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
 *          key value JSON object. Key is the method name (short),
 *          value is the similarity to the context name.
 *
 * Both types of requests are "async", meaning if local server does not have it, it would
 * immediately return HTTP 202 Accepted. Clients are responsible to query the API again later.
 */

import express from 'express';

const elasticsearch = require('elasticsearch');

const esclient = new elasticsearch.Client({
  host: 'search.ai.codes:9200',
  log: 'trace',
});

function createExpressServer(content, serverCache) {
    // Lookup cache or trigger async API to server. Returns result in cache or {}.
  function asyncLookup(contextId, outerMethod, className, notifyDash) {
    const typeErasedClassName = className.split('<')[0]; // Erase the generic type.
        // Skip for now.
    if (className.startsWith('com.fitbit.')) {
      return {};
    }
    const cacheKey = outerMethod + ':' + typeErasedClassName;
    if (serverCache.has(cacheKey)) {
      const weights = serverCache.get(cacheKey);
      if (notifyDash) {
        content.send('ice-display', contextId, typeErasedClassName, weights);
      }
      return weights;
    } else {
      content.send('similarity-lookup', contextId, typeErasedClassName, outerMethod, cacheKey, notifyDash);
      return {};
    }
  }

  const app = express();

    // ---------  Websocket API V 0.2 ------
    // ---------- for updating Intention sections as user moves carets around.-----------
  const expressWs = require('express-ws')(app);
  app.ws('/', (ws, req) => {
        // Messages from caret change.
    ws.on('message', (message) => {
      const jsonMessage = JSON.parse(message);
      const intention = {};
      intention.method = jsonMessage.methodName;
      intention.stanza = jsonMessage.intentions;
      intention.parameters = jsonMessage.parameters;
      intention.variables = jsonMessage.localVariables;
      intention.fields = jsonMessage.fields;
      content.send('ice-update-intention', intention);

      const contextId = 'dummy-context';
      for (const variableType of intention.variables) {
        asyncLookup(contextId, intention.method, variableType, false);
      }

      for (const parameterType of intention.parameters) {
        asyncLookup(contextId, intention.method, parameterType, false);
      }

      for (const fieldType of intention.fields) {
        asyncLookup(contextId, intention.method, fieldType, false);
      }
    });
    ws.on('ping', () => {
      ws.send('pong');
    });
    ws.on('open', () => {
      console.log('channel open');
    });
  });


    // HTTP endpoints.

    //  Smart snippet lookup.
  app.get('/snippet/:intention', (req, res) => {
    const result = {
      'header': {
        'status': 200,
      },
    };

    const intention = req.params['intention'];
    esclient.search({
      index: 'java_v5',
      type: 'snippet',
      body: {
        query: {
          match_phrase: {
            intent: {
              query: intention,
              slop: 1,
            },
          },
        },
      },
    }).then(function (resp) {
      if (resp.hits.total < 1) {
        result['response'] = {};
        res.json(result);
      } else {
        const snippets = [];
        for (const result of resp.hits.hits) {
          console.log(result);
          snippets.push(result._source.snippet);
        }
        result['snippets'] = snippets;
        res.json(result);
      }
    }, function (err) {
      console.trace(err.message);
      result['response'] = err.message;
      res.json(result);
    });
  });

    //  Method Context Similarity //
  app.get('/similarity/:contextId/:className/:outerMethod', (req, res) => {
    const contextId = req.params['contextId'];
    const className = req.params['className'];
    const outerMethod = req.params['outerMethod'];

    const result = {
      'header': {
        'status': 200,
      },
    };

    result['response'] = asyncLookup(contextId, outerMethod, className, true);
    res.json(result);
  });

    // Method Usage Stats //
  app.get('/usage/:contextId/:className', (req, res) => {
    const contextId = req.params['contextId'];
    const className = req.params['className'];

    const result = {
      'header': {
        'status': 200,
      },
      'response': {}, // default cache TTL for cold lookup: 1s
    };
    if (serverCache.has(className)) {
      result['response'] = serverCache.get(className);
      content.send('ice-display', contextId, className, result['response']);
    } else {
      content.send('usage-lookup', contextId, className);
    }
    res.json(result);
  });


    /** Deprecated API for updating method/stanza as user moves carets around.
     app.get('/ping/:method_name', (req, res) => {
        const methodName = req.params['method_name'];
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
    });*/


    // The annoying favicon when we use browser to poke the end point.
  app.get('/favicon.ico', (req, res) => {
    res.end('');
  });

  return app;
}

export default createExpressServer;
