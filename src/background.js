// This is main process of Electron, started as first thing when your
// app starts. This script is running through entire life of your application.
// It doesn't have any windows which you can see on screen, but we can open
// window from here.

import { app, Menu, ipcMain } from 'electron';
import { devMenuTemplate } from './menu/dev_menu_template';
import { editMenuTemplate } from './menu/edit_menu_template';
import createWindow from './helpers/window';
import populateClasses from './warm_up';


// Special module holding environment variables which you declared
// in config/env_xxx.json file.
import env from './env';
import createServer from './local_server';

const setApplicationMenu = function setApplicationMenu() {
  const menus = [editMenuTemplate];
  if (env.name !== 'production') {
    menus.push(devMenuTemplate);
  }
  Menu.setApplicationMenu(Menu.buildFromTemplate(menus));
};

// Save userData in separate folders for each environment.
// Thanks to this you can use production and development versions of the app
// on same machine like those are two separate apps.
if (env.name !== 'production') {
  const userDataPath = app.getPath('userData');
  app.setPath('userData', `${userDataPath} (${env.name})`);
}

const cache = new Map();

app.on('ready', () => {
  setApplicationMenu();

  const mainWindow = createWindow('main', {
    width: 500,
    height: 800,
  });

  mainWindow.loadURL('file://' + __dirname + '/app.html');
  const content = mainWindow.webContents;

  if (env.name === 'development') {
    mainWindow.openDevTools();
  }

  // ==== Starts a local Ai.codes server ========
  // Pre-populating a bunch of frequently used classes.
  content.on('did-finish-load', () => {
    populateClasses(content);
  });

  const PORT = 26337;
  const server = createServer(content, cache);

  server.listen(PORT, () => {
    // Callback triggered when server is successfully listening. Hurray!
    console.log('Server listening on: http://localhost:%s', PORT);
  });
  // ====== ai.codes code ends =========
});

app.on('window-all-closed', () => {
  app.quit();
});

app.on('will-quit', () => {
  app.quit();
});

// Sometimes methods from java.lang.Objects dominates the weight.
// This gives all these methods a discount before we have a better way to deal with them.
const javaLangObjectDiscount = 0.1;
const javaLangObject = 'java.lang.Object';

// Store the class -> extension (JSON object) mapping to cache.
ipcMain.on('ice-cache', (event, className, extension) => {
  // console.log('In Main process, storing to cache \''
  // + className + '\' -> ' + JSON.stringify(extension, null, 2));
  // console.log('JS cache size is  ' + cache.size);
  if (className === javaLangObject) {
    const newExtension = {};
    for (const k in extension) {
      if ({}.hasOwnProperty.call(extension, k)) {
        newExtension[k] = javaLangObjectDiscount * extension[k];
      }
    }
  } else {
    cache.set(className, extension);
  }
});
