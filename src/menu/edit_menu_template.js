export const editMenuTemplate = {
  label: 'Main',
  submenu: [
    {
      label: 'Intention',
      accelerator: 'CmdOrCtrl+N',
      click(item, focusedWindow) {
        if (focusedWindow) focusedWindow.loadURL(`file://${__dirname}/app.html`);
      },
    },
    {
      label: 'Preference',
      accelerator: 'CmdOrCtrl+,',
      click(item, focusedWindow) {
        if (focusedWindow) focusedWindow.loadURL(`file://${__dirname}/options.html`);
      },
    },
    {
      label: 'Quit',
      accelerator: 'CmdOrCtrl+Q',
      click(item, focusedWindow) {
        focusedWindow.close();
      },
    },
  ],
};
