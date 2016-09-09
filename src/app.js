import {ipcRenderer} from 'electron'; // native electron module
import {iceModel} from './ice_model';
import updateView from './dashboard_view';
import {fetchMethodUsage, fetchSimilarity} from './server_api';


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
    const new_value = value;
    if (key.includes(javaLangObject)) { // discount java.lang.Object
        for (const k in value) {
            if ({}.hasOwnProperty.call(value, k)) {
                new_value[k] = javaLangObjectDiscount * value[k];
            }
        }
    }
    ipcRenderer.send('ice-cache', key, new_value);
}

// Key method for managing ICE model.
ipcRenderer.on('ice-update-intention', (event, intention) => {
    let result = iceModel.updateIntention(intention);
    if (result) {
        updateView(iceModel);
    }
});


ipcRenderer.on('ice-display', updateModelContextAndView);

// ------------ Event listener to trigger server API requests -------------------

ipcRenderer.on('similarity-lookup', (event, contextId, className, outerMethod, cache_key) => {
    fetchSimilarity(className, outerMethod, result => {
        if (result['status'] != 404) { // server has it. otherwise there is no hope to updateContext ice.
            saveToCache(cache_key, result);
            updateModelContextAndView(null, contextId, className, result);
        }
    });
});

ipcRenderer.on('usage-lookup', (event, contextId, className) => {
    fetchMethodUsage(className, results => {
        if (results['status'] != 404) {
            saveToCache(className, results);
            updateModelContextAndView(null, contextId, className, results);
        }
    });
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
