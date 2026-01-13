const { BrowserWindow } = require('electron');
const path = require('path');

class MonoController {
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

        this.mainWindow = new BrowserWindow({
            width: 1000,
            height: 800,
            title: "Mono-Tâcheur",
            autoHideMenuBar: true,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            }
        });

        // CORRECT PATH to apps/mono-tacheur
        this.mainWindow.loadFile(path.join(__dirname, '../../apps/mono-tacheur/index.html'));

        this.mainWindow.on('closed', () => {
            this.close();
        });
    }

    close() {
        this.active = false;
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
            this.mainWindow.destroy();
        }
        this.mainWindow = null;
    }
}

module.exports = new MonoController();
