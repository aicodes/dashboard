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
import { fetchSnippets } from './server_api';
import { contextStore } from './context_store';

const primitiveType = new Set(['boolean', 'byte', 'char', 'short',
    'int', 'long', 'float', 'double',]);

function createExpressServer(content, serverCache, isIncognitoClass) {

  function eraseGenericType(typeName) {
    return typeName.split('<')[0];
  }

  // Lookup cache or trigger async API to server. Returns result in cache or {}.
  function asyncLookup(contextId, contextMethod, variable, notifyDash) {
    const type = eraseGenericType(variable.type); // Erase the generic type.
    if (isIncognitoClass(type)) {
      return {};
    }

    if (primitiveType.has(type)) { // Ignore primitive type.
      return {};
    }

    const cacheKey = `${contextMethod}:${type}`;
    if (serverCache.has(cacheKey)) {
      const weights = serverCache.get(cacheKey);
      if (notifyDash) {
        content.send('ice-display', contextId, type, weights);
      }
      return weights;
    }
    content.send('similarity-lookup', contextId, type,
      contextMethod, cacheKey, notifyDash);
    return {};
  }

  // Erase context-specific variable names and turn intention into a generic query
  // with type names. For instance, "convert myString to int" will become
  // "convert String to int".
  function rewriteQuery(intentionString) {
    const cachedContext = contextStore.get();
    const symbolTable = new Map();
    const localSymbolTable = new Map();
    console.log('In rewrite query');
    console.log(cachedContext);
    if (typeof cachedContext.variables !== 'undefined') {
      for (const variable of cachedContext.variables) {
        symbolTable.set(variable.name, eraseGenericType(variable.type));
      }
    }
    // Tokenize the intention string (may be URL encoded).
    const tokens = decodeURIComponent(intentionString.replace(/\+/g, '%20')).split(/\s+/);
    const newTokens = [];
    for (const token of tokens) {
      if (symbolTable.has(token)) {
        let tokenType = symbolTable.get(token);
        localSymbolTable.set(token, tokenType);
        // !!Hack!! will eventually be handled by backend for type shortcuts.
        if (tokenType.startsWith('java.lang.')) {
          tokenType = tokenType.substr(10);
        }

        if (tokenType.startsWith('java.util.')) {
          tokenType = tokenType.substr(10);
        }

        newTokens.push(tokenType);
      } else {
        newTokens.push(token);
      }
    }

    return {
      intention: encodeURIComponent(newTokens.join(' ')),
      symbols: localSymbolTable,
    };
  }

  function rewriteSnippets(symbolTable, snippets) {
    for (const snippet of snippets) {
      if (!('variables' in snippet)) continue;
      const localSymbolTable = new Map(symbolTable);

      // / Super dumb type matching. In future introduce some smart heuristics.
      for (const variable of snippet.variables) {
        for (const entry of localSymbolTable) {
          if (variable.type === entry[1]) {
            snippet.code = snippet.code.replace(new RegExp(variable.name, 'g'), entry[0]);
            localSymbolTable.delete(entry[0]);
          }
        }
      }
    }

    return snippets;
  }

  const app = express();

  // ---------  Websocket API V 0.2 ------
  // ---------- for updating Intention sections as user moves carets around.-----------
  const expressWs = require('express-ws')(app);
  app.ws('/', (ws, req) => {
      // Messages from caret change.
    ws.on('message', (message) => {
      const contextUpdate = JSON.parse(message);
      console.log(message);
      contextStore.save(contextUpdate);
      content.send('ice-update-intention', contextUpdate.intentions);
      const contextId = 'dummy-context';
      if (typeof (contextUpdate.variables) === 'undefined') return;
      for (const variable of contextUpdate.variables) {
        asyncLookup(contextId, contextUpdate.method, variable, false);
      }
    });
    ws.on('ping', () => {
      ws.send('pong');
    });
    ws.on('open', () => {
    });
  });

  // ------------- HTTP endpoints -----------
  //  Snippet lookup //
  app.get('/snippet/:intention', (req, res) => {
    const result = {
      header: {
        status: 200,
      },
      snippets: [],
    };

    const query = rewriteQuery(req.params.intention);
    fetchSnippets(query.intention, (snippets) => {
      result.snippets = rewriteSnippets(query.symbols, snippets);
      res.json(result);
    }, (error => {
      result.header.status = 400;
      result.header.message = error;
      res.json(result);
    }));
  });

  //  Method Context Similarity //
  app.get('/similarity/:contextId/:className/:outerMethod', (req, res) => {
    const contextId = req.params.contextId;
    const className = req.params.className;
    const outerMethod = req.params.outerMethod;

    const result = {
      header: {
        status: 200,
      },
    };

    const context = {
      type: className,
    };
    result.weights = asyncLookup(contextId, outerMethod, context, true);
    res.json(result);
  });

  // Method Usage Stats //
  app.get('/usage/:contextId/:className', (req, res) => {
    const contextId = req.params.contextId;
    const className = req.params.className;

    const result = {
      header: {
        status: 200,
      },
      weights: {}, // default cache TTL for cold lookup: 1s
    };
    if (serverCache.has(className)) {
      result.weights = serverCache.get(className);
      content.send('ice-display', contextId, className, result.weights);
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
