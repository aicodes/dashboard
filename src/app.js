import { ipcRenderer } from 'electron'; // native electron module
import { iceModel } from './ice_model';
import updateView from './dashboard_view';
import { fetchMethodUsage, fetchSimilarity } from './server_api';

function updateIce(error, iceId, intention, classContext, extension) {
  // Update Model object.
  iceModel.update(iceId, intention, classContext, extension);

  // Update view
  updateView(iceModel); // update the MD view.
}


ipcRenderer.on('ice-display', updateIce);

ipcRenderer.on('ice-lookup', (event, iceId, intention, className) => {
  fetchMethodUsage(className, extension => {
    ipcRenderer.send('ice-cache', className, extension);
    updateIce(null, iceId, intention, className, extension);
  });
});


// ------- Pre-populating key metrics --------------

ipcRenderer.on('fetch-method-usage-quiet', (event, className) => {
  fetchMethodUsage(className, extension => {
    ipcRenderer.send('ice-cache', className, extension);
  });
});

ipcRenderer.on('fetch-similarity-quiet', (event, contextName, items) => {
    fetchSimilarity();
});
