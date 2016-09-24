// This is main process of Electron, started as first thing when your
// app starts. This script is running through entire life of your application.
// It doesn't have any windows which you can see on screen, but we can open
// window from here.

// This process cannot access the same resources in app.js.
// The proper way to do IPC is through ipcMain and ipcRender.
// This process is `ipcMain`.

import { app, Menu, ipcMain } from 'electron';
import { devMenuTemplate } from './menu/dev_menu_template';
import { editMenuTemplate } from './menu/edit_menu_template';
import createWindow from './helpers/window';
import populateClasses from './warm_up';
import cache from './simple_cache';
import ExpressWs from 'express-ws';

// Special module holding environment variables which you declared
// in config/env_xxx.json file.
import env from './env';
import createServer from './editor_api';


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

app.on('ready', () => {
  setApplicationMenu();

  const mainWindow = createWindow('main', {
    width: 500,
    height: 800,
  });

  mainWindow.loadURL('file://' + __dirname + '/app.html');
  const content = mainWindow.webContents;

    /*
  if (env.name === 'development') {
    mainWindow.openDevTools();
  }*/
  // ==== Starts a local Ai.codes server ========
  // Pre-populating a bunch of frequently used classes.
  content.on('did-finish-load', () => {
    populateClasses(content);
  });

  const PORT = 26337;
  const express_server = createServer(content, cache);

  express_server.listen(PORT, () => {
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

// Store the class -> extension (JSON object) mapping to cache.
ipcMain.on('ice-cache', (event, className, extension) => {
  cache.set(className, extension);
});
