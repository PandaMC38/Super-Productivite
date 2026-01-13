const { app, BrowserWindow, ipcMain, screen, clipboard } = require('electron');
const path = require('path');
const fs = require('fs');

// Controllers for specific Overlays (TimeBar & Focus)
const focusController = require('./src/controllers/focus-controller');
const timebarController = require('./src/controllers/timebar-controller');

// Map for Overlay Apps (Must match folder names exactly)
const overlayMap = {
    'Focus-Visuel-main': focusController,
    'Barre-de-Temps-Visuelle-main': timebarController
};

let dashboardWindow;
let lastClipboardContent = '';
let clipboardInterval = null;

function getInstalledApps() {
    const appsDir = path.join(__dirname, 'apps');
    if (!fs.existsSync(appsDir)) return [];

    const dirs = fs.readdirSync(appsDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

    return dirs;
}

function createDashboard() {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;

    dashboardWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 900,
        minHeight: 600,
        title: "Super Productivité",
        frame: false,
        transparent: true,
        backgroundColor: '#00000000',
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            webviewTag: true
        }
    });

    dashboardWindow.loadFile('src/dashboard/index.html');

    dashboardWindow.webContents.on('did-finish-load', () => {
        const apps = getInstalledApps();
        dashboardWindow.webContents.send('app-list', apps);

        // KILL SPLASH SCREEN NOW
        // We kill all mshta processes to be sure, or specifically our splash
        require('child_process').exec('taskkill /F /IM mshta.exe /T', (err) => {
            if (err) console.log("Splash screen kill attempt (might already be closed)");
        });
    });

    // CRITICAL: When the main window closes (Alt+F4 or Button), KILL EVERYTHING.
    dashboardWindow.on('closed', () => {
        console.log('Main window closed. Exiting app...');
        // Destroy all other windows (overlays)
        BrowserWindow.getAllWindows().forEach(win => {
            if (win && !win.isDestroyed()) win.destroy();
        });
        app.exit(0);
    });
}

function startClipboardMonitoring() {
    if (clipboardInterval) clearInterval(clipboardInterval);

    clipboardInterval = setInterval(() => {
        if (!dashboardWindow || dashboardWindow.isDestroyed()) return;

        const text = clipboard.readText();
        if (text !== lastClipboardContent && text.trim().length > 0) {
            lastClipboardContent = text;
            // Send to Dashboard (which will forward to webview if active)
            dashboardWindow.webContents.send('clipboard-update', text);
        }
    }, 1000);
}

app.whenReady().then(() => {
    createDashboard();
    startClipboardMonitoring();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createDashboard();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.exit(0);
    }
});

// IPC Controls
// IPC Controls
ipcMain.on('window-minimize', () => dashboardWindow.minimize());
ipcMain.on('window-close', () => {
    // Forcefully close all windows to ensure app quits
    BrowserWindow.getAllWindows().forEach(win => win.destroy());
    app.exit(0); // Force exit immediately
});

// Handler for Sidebar Actions
ipcMain.on('activate-app', (event, appFolder) => {
    // Check if it's an overlay app
    const overlayController = overlayMap[appFolder];

    // Explicit Debugging
    console.log(`Activate App Request: ${appFolder}`);
    console.log(`Is Overlay? ${!!overlayController}`);

    if (overlayController) {
        // Toggle the overlay
        try {
            overlayController.launch();
            event.sender.send('app-type', { folder: appFolder, type: 'overlay' });
        } catch (e) {
            console.error('Error launching overlay:', e);
        }
    } else {
        // It's a standard web app (Mono, Bionic)
        const appPath = path.join(__dirname, 'apps', appFolder, 'index.html');
        if (fs.existsSync(appPath)) {
            event.sender.send('load-content', { folder: appFolder, path: appPath });
        } else {
            console.error(`Index.html not found for ${appFolder}`);
        }
    }
});
