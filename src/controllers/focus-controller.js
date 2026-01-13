const { BrowserWindow, screen, globalShortcut, ipcMain } = require('electron');
const path = require('path');

class FocusController {
    constructor() {
        this.overlayWindows = [];
        this.mousePollingInterval = null;
        this.zOrderInterval = null;
        this.settings = {
            height: 100,
            opacity: 0.5
        };
        this.active = false;
    }

    launch() {
        if (this.active) {
            this.toggleOverlay();
            return;
        }
        this.active = true;

        this.createOverlayWindows();
        this.startMousePolling();
        this.startZOrderEnforcement();

        // Listen for settings updates from Main Dashboard
        ipcMain.on('update-focus-settings', (event, newSettings) => {
            this.updateSettings(newSettings);
        });
    }

    createOverlayWindows() {
        const displays = screen.getAllDisplays();
        this.overlayWindows = displays.map(display => {
            const { x, y, width, height } = display.bounds;
            const win = new BrowserWindow({
                x, y, width, height,
                transparent: true,
                backgroundColor: '#00000000',
                frame: false,
                alwaysOnTop: true,
                skipTaskbar: true,
                focusable: false,
                type: 'toolbar',
                enableLargerThanScreen: true,
                webPreferences: {
                    nodeIntegration: true,
                    contextIsolation: false
                }
            });

            win.setAlwaysOnTop(true, 'screen-saver');
            win.setIgnoreMouseEvents(true, { forward: true });

            win.loadFile(path.join(__dirname, '../../apps/Focus-Visuel-main/src/index.html'));

            // Apply initial settings when ready
            win.webContents.on('did-finish-load', () => {
                win.webContents.send('update-settings', this.settings);
            });

            return win;
        });
    }

    updateSettings(newSettings) {
        // Handle Shortcut Update
        if (newSettings.shortcut && newSettings.shortcut !== this.settings.shortcut) {
            try {
                if (this.settings.shortcut) {
                    globalShortcut.unregister(this.settings.shortcut);
                }
                globalShortcut.register(newSettings.shortcut, () => this.toggleOverlay());
                console.log(`Shortcut updated to: ${newSettings.shortcut}`);
            } catch (e) {
                console.error(`Failed to register shortcut: ${newSettings.shortcut}`, e);
            }
        }

        // Handle Active State Update (if toggled from UI switch)
        if (newSettings.active !== undefined) {
            // If new state is diff from current, toggle
            if (newSettings.active !== (this.overlayWindows[0] && this.overlayWindows[0].isVisible())) {
                this.toggleOverlay();
            }
        }

        this.settings = { ...this.settings, ...newSettings };
        this.overlayWindows.forEach(win => {
            if (win && !win.isDestroyed()) {
                win.webContents.send('update-settings', this.settings);
            }
        });
    }

    startMousePolling() {
        if (this.mousePollingInterval) clearInterval(this.mousePollingInterval);
        this.mousePollingInterval = setInterval(() => {
            const point = screen.getCursorScreenPoint();
            this.overlayWindows.forEach(win => {
                if (win && !win.isDestroyed()) {
                    win.webContents.send('update-cursor', point);
                }
            });
        }, 16);
    }

    startZOrderEnforcement() {
        if (this.zOrderInterval) clearInterval(this.zOrderInterval);
        this.zOrderInterval = setInterval(() => {
            this.overlayWindows.forEach(win => {
                if (win && !win.isDestroyed() && win.isVisible()) {
                    win.setAlwaysOnTop(true, 'screen-saver');
                    win.moveTop();
                }
            });
        }, 500);
    }

    toggleOverlay() {
        if (!this.overlayWindows.length) return;
        const firstWin = this.overlayWindows[0];
        if (!firstWin || firstWin.isDestroyed()) return;

        const shouldShow = !firstWin.isVisible();
        this.overlayWindows.forEach(win => {
            if (win && !win.isDestroyed()) {
                shouldShow ? win.show() : win.hide();
            }
        });
    }
}

module.exports = new FocusController();
