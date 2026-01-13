const { ipcRenderer } = require('electron');

const appContainer = document.getElementById('app-list-container');
const homeView = document.getElementById('view-home');
const webAppView = document.getElementById('view-webapp');
const appCount = document.getElementById('app-count');

// Settings UI
const focusSettingsPanel = document.getElementById('focus-settings');
const rangeHeight = document.getElementById('range-height');
const rangeOpacity = document.getElementById('range-opacity');
const valSize = document.getElementById('val-size');
const valOpacity = document.getElementById('val-opacity');
const btnToggleFocus = document.getElementById('btn-toggle-focus');
const inputShortcut = document.getElementById('input-shortcut');

let activeWebview = null;
let activeFolder = '';
let isFocusActive = false; // Track toggle state

// App Config for Icons/Names
const appConfig = {
    'Mono-T-cheur-main': { title: "Mono-Tâcheur", icon: "🎯" },
    'Focus-Visuel-main': { title: "Focus Visuel", icon: "👁️" },
    'Lecture-Bionique-main': { title: "Lecture Bionique", icon: "🧠" },
    'Barre-de-Temps-Visuelle-main': { title: "Barre de Temps", icon: "⏳" }
};

// --- Settings Logic ---
rangeHeight.addEventListener('input', (e) => {
    const val = e.target.value;
    valSize.innerText = `${val}px`;
    ipcRenderer.send('update-focus-settings', { height: parseInt(val) });
});

rangeOpacity.addEventListener('input', (e) => {
    const val = e.target.value;
    valOpacity.innerText = `${Math.round(val * 100)}%`;
    ipcRenderer.send('update-focus-settings', { opacity: parseFloat(val) });
});

// Toggle Button
btnToggleFocus.addEventListener('click', () => {
    isFocusActive = !isFocusActive;
    updateToggleButton();
    // Send update to controller
    ipcRenderer.send('update-focus-settings', { active: isFocusActive });
});

function updateToggleButton() {
    if (isFocusActive) {
        btnToggleFocus.innerText = "Désactiver";
        btnToggleFocus.classList.add('active'); // Green style
    } else {
        btnToggleFocus.innerText = "Activer";
        btnToggleFocus.classList.remove('active');
    }
}

// Shortcut Recorder
inputShortcut.addEventListener('keydown', (e) => {
    e.preventDefault();

    // Ignore standalone modifier keys
    if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) return;

    const modifiers = [];
    if (e.ctrlKey) modifiers.push('CommandOrControl');
    if (e.metaKey) modifiers.push('CommandOrControl');
    if (e.shiftKey) modifiers.push('Shift');
    if (e.altKey) modifiers.push('Alt');

    let key = e.key.toUpperCase();
    if (key === ' ') key = 'Space';

    const shortcutString = [...modifiers, key].join('+');
    inputShortcut.value = shortcutString;

    // Send update
    ipcRenderer.send('update-focus-settings', { shortcut: shortcutString });
});


// --- Navigation Logic ---
function switchView(viewName) {
    if (viewName === 'home') {
        homeView.classList.add('active');
        webAppView.classList.remove('active');
        webAppView.innerHTML = '';
        activeWebview = null;
    } else {
        homeView.classList.remove('active');
        webAppView.classList.add('active');
    }
}

// --- Sidebar Item Click ---
function onAppClick(folderName, el) {
    activeFolder = folderName;

    // UI Update
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    el.classList.add('active');

    // Show/Hide Settings based on app
    if (folderName === 'Focus-Visuel-main') {
        focusSettingsPanel.style.display = 'block';
    } else {
        focusSettingsPanel.style.display = 'none';
    }

    // Tell Main to Activate
    ipcRenderer.send('activate-app', folderName);
}

// --- IPC Listeners ---

ipcRenderer.on('app-list', (event, apps) => {
    const homeBtn = appContainer.querySelector('[data-target="home"]');
    appContainer.innerHTML = '';
    appContainer.appendChild(homeBtn);

    apps.forEach(app => {
        const config = appConfig[app] || { title: app, icon: "📦" };

        const item = document.createElement('div');
        item.className = 'nav-item';
        item.innerHTML = `<span class="icon">${config.icon}</span> ${config.title}`;
        item.onclick = () => onAppClick(app, item);

        appContainer.appendChild(item);
    });

    appCount.innerText = apps.length;
});

ipcRenderer.on('load-content', (event, { folder, path }) => {
    switchView('webapp');
    webAppView.innerHTML = '';
    const webview = document.createElement('webview');
    webview.src = `file://${path}`;
    webview.setAttribute('nodeintegration', 'true');
    webview.setAttribute('webpreferences', 'contextIsolation=false');
    webAppView.appendChild(webview);
    activeWebview = webview;
});

ipcRenderer.on('app-type', (event, { folder, type }) => {
    if (type === 'overlay') {
        const item = Array.from(document.querySelectorAll('.nav-item')).find(el => el.innerText.includes(appConfig[folder].title));
        if (item) {
            const originalColor = item.style.color;
            item.style.color = "#4CAF50";
            setTimeout(() => item.style.color = "", 500);
        }
    }
});

ipcRenderer.on('clipboard-update', (event, text) => {
    if (activeWebview && activeFolder === 'Lecture-Bionique-main') {
        try {
            activeWebview.send('new-text', text);
        } catch (e) { }
    }
});

// --- Window Controls ---
document.getElementById('btn-minimize').addEventListener('click', () => ipcRenderer.send('window-minimize'));
document.getElementById('btn-close').addEventListener('click', () => ipcRenderer.send('window-close'));
document.querySelector('[data-target="home"]').addEventListener('click', (e) => {
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    e.currentTarget.classList.add('active');
    focusSettingsPanel.style.display = 'none'; // Hide settings on home
    switchView('home');
});
