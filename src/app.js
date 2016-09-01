import { ipcRenderer } from 'electron'; // native electron module
import IceModel from './ice_model';
import updateView from './dashboard_view';
import fetchMethodUsage from './server_api';

const iceModel = new IceModel();


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

// A special class just for pre-populating class names.
ipcRenderer.on('ice-lookup-quiet', (event, className) => {
  fetchMethodUsage(className, extension => {
    ipcRenderer.send('ice-cache', className, extension);
  });
});
