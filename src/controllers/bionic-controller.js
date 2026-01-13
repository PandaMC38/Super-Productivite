const { BrowserWindow, clipboard, ipcMain } = require('electron');
const path = require('path');

class BionicController {
    constructor() {
        this.mainWindow = null;
        this.clipboardInterval = null;
        this.lastClipboardContent = '';
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
            width: 600,
            height: 400,
            alwaysOnTop: true,
            title: "Lecteur Bionique",
            autoHideMenuBar: true,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            }
        });

        // CORRECT PATH to apps/lecture-bionique
        this.mainWindow.loadFile(path.join(__dirname, '../../apps/lecture-bionique/index.html'));

        this.mainWindow.on('closed', () => {
            this.close();
        });

        this.startClipboardMonitoring();
    }

    startClipboardMonitoring() {
        if (this.clipboardInterval) clearInterval(this.clipboardInterval);

        this.clipboardInterval = setInterval(() => {
            if (!this.mainWindow || this.mainWindow.isDestroyed()) return;

            const text = clipboard.readText();
            if (text !== this.lastClipboardContent && text.trim().length > 0) {
                this.lastClipboardContent = text;
                this.mainWindow.webContents.send('new-text', text);
            }
        }, 1000);
    }

    close() {
        this.active = false;
        if (this.clipboardInterval) clearInterval(this.clipboardInterval);

        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
            this.mainWindow.destroy(); // Force close
        }
        this.mainWindow = null;
    }
}

module.exports = new BionicController();
