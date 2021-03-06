/** This file is part of the rendering process. It cannot directly communicate
 * with background.js (main process).
 */

import { ipcRenderer } from 'electron'; // native electron module
import { iceModel } from './ice_model';
import updateView from './dashboard_view';
import { fetchMethodUsage, fetchSimilarity } from './server_api';

function updateModelContextAndView(error, contextId, context, extension) {
  // Update Model object.
  iceModel.updateContext(contextId, context, extension);

  // Update view
  updateView(iceModel); // updateContext the MD view.
}

// Sometimes methods from java.lang.Objects dominates the weight.
// This gives all these methods a discount before we have a better way to deal with them.
const javaLangObjectDiscount = 0.1;
const javaLangObject = 'java.lang.Object';

/** Save the key-value pair in local cache.
 * Note that cache lives '\;We have to send an event to ipcRender to store the item to cache.
 *  This is because app.js does not have direct access to server cache, which
 * is owned by the main process.
 */
function saveToCache(key, value) {
  const newWeight = value;
  if (key.includes(javaLangObject)) { // discount java.lang.Object
    for (const k in value) {
      if ({}.hasOwnProperty.call(value, k)) {
        newWeight[k] = javaLangObjectDiscount * value[k];
      }
    }
  }

  ipcRenderer.send('ice-cache', key, newWeight);
}

// Key method for managing ICE model.
ipcRenderer.on('ice-update-intention', (event, intention) => {
  const shouldUpdateView = iceModel.update(intention);
  if (shouldUpdateView) {
    updateView(iceModel);
  }
});

ipcRenderer.on('ice-display', updateModelContextAndView);

// ------------ Event listener to trigger server API requests -------------------

ipcRenderer.on('similarity-lookup',
    (event, contextId, className, outerMethod, cacheKey, shouldUpdateDash) => {
      fetchSimilarity(className, outerMethod, result => {
        // server has it. otherwise there is no hope to updateContext ice.
        if (result.status !== 404) {
          saveToCache(cacheKey, result);
          updateModelContextAndView(null, contextId, className, result);
        }
      });
    });

ipcRenderer.on('usage-lookup', (event, contextId, className) => {
  fetchMethodUsage(className, results => {
    if (results.status !== 404) {
      saveToCache(className, results);
      updateModelContextAndView(null, contextId, className, results);
    }
  });
});

// -------- auto-update.
ipcRenderer.on('app-update-downloaded', (event, releaseName) => {
  console.log('updated downloaded and app notified');
  const button = document.getElementsById('statusBar');
  button.style.display = 'flex';
});

// ------- Pre-populating key metrics --------------
/*
ipcRenderer.on('fetch-method-usage-quiet', (event, className) => {
    fetchMethodUsage(className, results => {
        saveToCache(className, results);
    });
});

ipcRenderer.on('fetch-similarity-quiet', (event, className, contextName) => {
    fetchSimilarity(className, contextName, results => {

    });
});
*/
