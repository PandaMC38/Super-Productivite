const { BrowserWindow, screen, ipcMain, globalShortcut, shell } = require('electron');
const path = require('path');

class TimeBarController {
    constructor() {
        this.mainWindow = null;
        this.active = false;
    }

    launch() {
        if (this.active && this.mainWindow && !this.mainWindow.isDestroyed()) {
            this.mainWindow.show();
            this.mainWindow.focus();
            return;
        }
        this.active = true;

        const { width } = screen.getPrimaryDisplay().workAreaSize;

        this.mainWindow = new BrowserWindow({
            width: width,
            height: 60,
            x: 0,
            y: 0,
            frame: false,
            transparent: true,
            alwaysOnTop: true,
            skipTaskbar: true,
            hasShadow: false,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            }
        });

        // CORRECT PATH to apps/barre-de-temps
        this.mainWindow.loadFile(path.join(__dirname, '../../apps/Barre-de-Temps-Visuelle-main/index.html'));

        this.mainWindow.setIgnoreMouseEvents(false);

        // Global Shortcut Alt+T
        try {
            globalShortcut.register('Alt+T', () => {
                if (this.mainWindow && !this.mainWindow.isDestroyed()) {
                    this.mainWindow.webContents.send('reset-timer');
                    this.mainWindow.setIgnoreMouseEvents(false);
                    this.mainWindow.focus();
                }
            });
        } catch (e) { console.error(e); }

        this.mainWindow.on('closed', () => {
            this.close();
        });

        // Note: IPC listeners for 'start-timer', 'resize-window' etc.
        // In a strictly modular design, we'd handle them here carefully.
        // Assuming unique event names or shared handling.
        // Since the original code uses specific channel names, we need to ensure main.js doesn't conflict.
        // I will add the ipcMain listeners in the Main file or here if they can be dynamically added/removed.
        // Electron allows checking if listener exists.

        // For now, I'll rely on the fact that these IPC events are specific to this app.
    }

    close() {
        this.active = false;
        globalShortcut.unregister('Alt+T');
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
            this.mainWindow.destroy();
        }
        this.mainWindow = null;
    }
}

// We need to attach the IPC listeners only once globally, OR handle them dynamically.
// A common pattern is to just attach them. If they are already attached, it might restart logic.
// For the purpose of this merge, I'll attach them here but safeguard against duplicates if needed.
// However, `ipcMain.on` adds a listener. 

ipcMain.on('start-timer', () => {
    // We need to find the correct window instance. Since module.exports is a singleton, we can access it?
    // This part is tricky in modules. 
    // Use `BrowserWindow.fromWebContents(event.sender)` to identify the source.
});

// BETTER APPROACH: Add the IPC logic inside the export, but we need reference to the instance.
// I will move the IPC logic to the main.js (Unified) or keep it here but use `BrowserWindow.fromWebContents` to be safe.

ipcMain.on('timebar-resize-window', (event, height) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
        const { width } = screen.getPrimaryDisplay().workAreaSize;
        win.setSize(width, height);
    }
});

// I'll need to update the CLIENT (renderer) code in the apps to use these new specific channel names 
// OR just keep using the old ones if they don't conflict.
// 'resize-window', 'start-timer', 'time-up', 'set-fullscreen-flash' seem specific enough.

ipcMain.on('start-timer', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) win.setIgnoreMouseEvents(true, { forward: true });
});

ipcMain.on('time-up', () => {
    shell.beep();
});

ipcMain.on('set-fullscreen-flash', (event, enable) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
        const { width, height } = screen.getPrimaryDisplay().workAreaSize;
        if (enable) {
            win.setSize(width, height);
            win.setIgnoreMouseEvents(true, { forward: true });
        } else {
            win.setSize(width, 60);
        }
    }
});

module.exports = new TimeBarController();
