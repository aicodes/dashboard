// This is main process of Electron, started as first thing when your
// app starts. This script is running through entire life of your application.
// It doesn't have any windows which you can see on screen, but we can open
// window from here.

import { app, Menu, ipcMain } from 'electron';
import { devMenuTemplate } from './menu/dev_menu_template';
import { editMenuTemplate } from './menu/edit_menu_template';
import createWindow from './helpers/window';

// Special module holding environment variables which you declared
// in config/env_xxx.json file.
import env from './env';
import create_server from './serve';

var setApplicationMenu = function () {
    var menus = [editMenuTemplate];
    if (env.name !== 'production') {
        menus.push(devMenuTemplate);
    }
    Menu.setApplicationMenu(Menu.buildFromTemplate(menus));
};

// Save userData in separate folders for each environment.
// Thanks to this you can use production and development versions of the app
// on same machine like those are two separate apps.
if (env.name !== 'production') {
    var userDataPath = app.getPath('userData');
    app.setPath('userData', userDataPath + ' (' + env.name + ')');
}

var cache = new Map();

app.on('ready', function () {
    setApplicationMenu();

    var mainWindow = createWindow('main', {
        width: 500,
        height: 800
    });

    mainWindow.loadURL('file://' + __dirname + '/app.html');
    let content = mainWindow.webContents;

    if (env.name === 'development') {
        mainWindow.openDevTools();
    }

    // ==== Starts a local Ai.codes server ========
    const PORT = 26337;
    var server = create_server(content, cache);

    server.listen(PORT, function(){
        //Callback triggered when server is successfully listening. Hurray!
        console.log("Server listening on: http://localhost:%s", PORT);
    });
    // ====== ai.codes code ends =========

});

app.on('window-all-closed', function () {
    app.quit();
});

app.on('will-quit', function () {
    app.quit();
});


// Store the class -> extension (JSON object) mapping to cache.
ipcMain.on('ice-cache', (event, className, extension) => {
    "use strict";
    console.log('In Main process, storing to cache \'' + className + '\' -> ' + JSON.stringify(extension, null, 2));
    console.log('JS cache size is  ' + cache.size);
    cache.set(className, extension);
});
