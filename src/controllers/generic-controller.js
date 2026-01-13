const { BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

class GenericController {
    constructor() {
        this.windows = new Map();
    }

    launch(appPath, appName) {
        // Check if index.html exists
        const htmlPath = path.join(appPath, 'index.html');
        if (!fs.existsSync(htmlPath)) {
            console.error(`GenericController: No index.html found in ${appPath}`);
            return;
        }

        // Check if already open
        if (this.windows.has(appPath)) {
            const win = this.windows.get(appPath);
            if (!win.isDestroyed()) {
                win.show();
                win.focus();
                return;
            }
        }

        const win = new BrowserWindow({
            width: 1024,
            height: 768,
            title: appName,
            autoHideMenuBar: true,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            }
        });

        win.loadFile(htmlPath);

        win.on('closed', () => {
            this.windows.delete(appPath);
        });

        this.windows.set(appPath, win);
    }
}

module.exports = new GenericController();
