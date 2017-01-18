// This is main process of Electron, started as first thing when your
// app starts. This script is running through entire life of your application.
// It doesn't have any windows which you can see on screen, but we can open
// window from here.

// This process cannot access the same resources in app.js.
// The proper way to do IPC is through ipcMain and ipcRender.
// This process is `ipcMain`.

import {os} from 'os';
import {app, Menu, ipcMain, autoUpdater} from 'electron';
import {devMenuTemplate} from './menu/dev_menu_template';
import {editMenuTemplate} from './menu/edit_menu_template';
import createWindow from './helpers/window';
import populateClasses from './warm_up';
import cache from './simple_cache';
import { config } from './simple_config';

// Special module holding environment variables which you declared
// in config/env_xxx.json file.
import env from './env';
import createServer from './editor_api';

let preferences = config.get('preferences');
app.commandLine.appendSwitch('--disable-http-cache');

const os = require('os');

const setApplicationMenu = function setApplicationMenu() {
  const menus = [editMenuTemplate];

  if (env.name !== 'production') {
    menus.push(devMenuTemplate);
  }

  Menu.setApplicationMenu(Menu.buildFromTemplate(menus));
};


function isIncognitoClass(className) {
  // / Skip incognito classes
  if (preferences === undefined || preferences.incognito === undefined) {
    return false;
  }

  const incognitoRules = preferences.incognito;
  for (const rule of incognitoRules) {
    if (className === rule) {
      return true;
    }

    if (className.search(rule) !== -1) {
      return true;
    }
  }

  return false;
}


function configAutoUpdater(updater, content) {
  console.log(os);
  const platform = `${os.platform()}_${os.arch()}`;
  const version = app.getVersion();

  updater.setFeedURL(`https://aicodes-nuts.herokuapp.com/update/${platform}/${version}`);
  updater.checkForUpdates();
  updater.on('update-downloaded',
    (event, releaseNotes, releaseName, releaseDate, updateURL) => {
      content.send('app-update-downloaded', releaseName);
    }
  );
  updater.on('checking-for-update', () => {
    console.log('Checking for updates');
  });
  updater.on('update-available', () => {
    console.log('Updates available');
  });
}

// Save userData in separate folders for each environment.
// Thanks to this you can use production and development versions of the app
// on same machine like those are two separate apps.
//
// TODO: This trick would work if we have a way to unify the settings path used by
// both app (render process) and remote (main process).
/*
if (env.name !== 'production') {
  const userDataPath = app.getPath('userData');
  app.setPath('userData', `${userDataPath} (${env.name})`);
  // remoteApp.setPath('userData', `${userDataPath} (${env.name})`);
}*/

/* OAuth protocol is not really a desktop-friendly protocol for
 * widely distributed desktop app. It is especially so for open source
 * desktop apps, as you'd need to store client key and secret somewhere.
 * Obfuscation creates fake sense of security anyway.
 *
 * We opt to do OAuth 100% server-side. We need a way to pass the
 * authenticated user token to Electron, though. The IPC mechanism
 * for WebContent (especially for non-electron page hosted online) is
 * rather limited. The `AIcodes hack` we came up is to monitor URL changes,
 * and backend would issue a special redirection, appending user token
 * to the redirect URL so Electron can capture.
 *
 * HTTPS protocol ensures that the URL is as secure as the page content.
 */
/*
function captureUserToken(window, content) {
  // Issue an async request. Will be captured by the event above.
   content.on('did-navigate', (event, url) => {
   content.on('found-in-page', (foundEvent, result) => {
   console.log('... found in page event is triggered....');
   console.log(result);
   content.stopFindInPage('clearSelection');
   // window.loadURL(`file://${__dirname}/app.html`);
   });
   content.findInPage('nuts');
   });
  content.on('did-finish-load', () => {
    console.log('finished loading');
     content.on('found-in-page', (foundEvent, result) => {
     console.log('... found in page event is triggered....');
     console.log(result);
     content.stopFindInPage('clearSelection');
     // window.loadURL(`file://${__dirname}/app.html`);
     });
     content.findInPage('demo.*ze');
  });

  content.on('did-navigate', (event, url) => {
    const results = url.split('#');
    if (results.length > 1) {
      console.log(`User Access Token is: ${results[1]}.`);
    }
  });
}
*/

app.on('ready', () => {
  setApplicationMenu();

  const mainWindow = createWindow('main', {
    width: 500,
    height: 800,
  });

  mainWindow.loadURL(`file://${__dirname}/app.html`);
  // mainWindow.loadURL('https://www.ai.codes/oauth.html');
  const content = mainWindow.webContents;
  // captureUserToken(mainWindow, content);

  /*
   if (env.name === 'development') {
   mainWindow.openDevTools();
   } */

  // ==== Starts a local Ai.codes server ========
  // Pre-populating a bunch of frequently used classes.
  content.on('did-finish-load', () => {
    populateClasses(content);
  });

  const PORT = 26337;
  const expressServer = createServer(content, cache, isIncognitoClass);

  expressServer.listen(PORT, () => {
    // Callback triggered when server is successfully listening. Hurray!
    console.log('Server listening on: http://localhost:%s', PORT);
  });

  // Skip checking version update if it is not production.
  // Windows has some issues, ignore that platform for now.
  if (env.name === 'production' && os.platform() !== 'win32') {
    configAutoUpdater(autoUpdater, content);
  }

  ipcMain.on('update-quit-install', () => {
    mainWindow.setClosable(true);
    autoUpdater.quitAndInstall();
  });

  // ====== ai.codes code ends =========
});

app.on('window-all-closed', () => {
  app.quit();
});

app.on('will-quit', () => {
  app.quit();
});

// Store the class -> extension (JSON object) mapping to cache.
ipcMain.on('ice-cache', (event, className, extension) => {
  cache.set(className, extension);
});

// Preferences
ipcMain.on('load-preference', (event) => {
  const result = config.get('preferences');
  if (result === undefined) {
    config.set('preferences', {incognito: []});
  }

  event.sender.send('update-preference-display', config.get('preferences'));
});

ipcMain.on('save-preference', (event, updatedPreferences) => {
  preferences = updatedPreferences;
  config.set('preferences', updatedPreferences);
});

