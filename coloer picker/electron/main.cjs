const { app, BrowserWindow, ipcMain, screen, globalShortcut, dialog } = require('electron');
const path = require('path');
const screenshot = require('screenshot-desktop');
const { autoUpdater } = require('electron-updater');

// Configure auto-updater
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

let mainWindow;
let overlayWindow;

// --- STATE ---
let isMinimized = false;
let expandedBounds = { x: null, y: null, width: 340, height: 600 };
let minimizedBounds = { x: null, y: null, width: 60, height: 60 };

function createWindow() {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;

    // Defaults
    expandedBounds.x = width - 360;
    expandedBounds.y = height - 600 - 50;
    minimizedBounds.x = width - 80;
    minimizedBounds.y = height - 80;

    // Determine icon path for production vs dev
    const iconPath = !app.isPackaged
        ? path.join(__dirname, '../public/icon.ico')
        : path.join(process.resourcesPath, 'icon.ico');

    // Load icon using nativeImage for better Windows compatibility
    const { nativeImage } = require('electron');
    let appIcon = null;
    try {
        appIcon = nativeImage.createFromPath(iconPath);
        if (appIcon.isEmpty()) {
            console.log('Icon not found at:', iconPath);
        }
    } catch (e) {
        console.log('Error loading icon:', e);
    }

    mainWindow = new BrowserWindow({
        width: expandedBounds.width,
        height: expandedBounds.height,
        x: expandedBounds.x,
        y: expandedBounds.y,
        frame: false,
        transparent: true,
        resizable: false,
        alwaysOnTop: true, // BASE LEVEL
        skipTaskbar: false,
        icon: appIcon || iconPath, // Custom icon for taskbar
        webPreferences: {
            preload: path.join(__dirname, 'preload.cjs'),
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    const startUrl = !app.isPackaged
        ? 'http://localhost:5173'
        : `file://${path.join(app.getAppPath(), 'dist', 'index.html')}`;

    mainWindow.loadURL(startUrl);

    // --- PERSISTENT OVERLAY CREATION ---
    createPersistentOverlay();

    // Position Tracking
    mainWindow.on('move', () => {
        try {
            const [x, y] = mainWindow.getPosition();
            if (isMinimized) {
                minimizedBounds.x = x;
                minimizedBounds.y = y;
            } else {
                expandedBounds.x = x;
                expandedBounds.y = y;
            }
        } catch (e) { }
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
        app.quit();
    });
}

function createPersistentOverlay() {
    const { width, height } = screen.getPrimaryDisplay().bounds;

    overlayWindow = new BrowserWindow({
        width, height,
        x: 0, y: 0,
        transparent: true,
        frame: false,
        fullscreen: true,
        show: false, // HIDDEN BY DEFAULT
        skipTaskbar: true,
        resizable: false,
        movable: false,
        alwaysOnTop: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.cjs'),
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    const url = !app.isPackaged
        ? 'http://localhost:5173/#/overlay'
        : `file://${path.join(app.getAppPath(), 'dist', 'index.html')}#/overlay`;
    overlayWindow.loadURL(url);

    // Prevent closing, just hide
    overlayWindow.on('close', (e) => {
        if (mainWindow) {
            e.preventDefault();
            overlayWindow.hide();
            return false;
        }
    });
}


// --- IPC COMMANDS ---

// MODE
ipcMain.handle('set-mode', (event, mode) => {
    if (!mainWindow) return;
    try {
        if (mode === 'minimized') {
            isMinimized = true;
            const x = Math.round(minimizedBounds.x || 0);
            const y = Math.round(minimizedBounds.y || 0);
            mainWindow.setBounds({ x, y, width: 60, height: 60 });
        } else {
            isMinimized = false;
            const x = Math.round(expandedBounds.x || 0);
            const y = Math.round(expandedBounds.y || 0);
            mainWindow.setBounds({ x, y, width: 340, height: 600 });
        }
    } catch (e) { }
});

ipcMain.on('window-move', (event, { x, y }) => {
    if (!mainWindow) return;
    try {
        const dx = Math.round(Number(x));
        const dy = Math.round(Number(y));
        if (isNaN(dx) || isNaN(dy)) return;

        const [currX, currY] = mainWindow.getPosition();
        mainWindow.setPosition(currX + dx, currY + dy);

        // Sync
        if (isMinimized) { minimizedBounds.x = currX + dx; minimizedBounds.y = currY + dy; }
        else { expandedBounds.x = currX + dx; expandedBounds.y = currY + dy; }
    } catch (e) { }
});

ipcMain.handle('minimize-app', () => {
    if (overlayWindow) overlayWindow.hide();
    mainWindow?.minimize();
});
ipcMain.handle('close-app', () => { app.quit(); });


// PICKING
ipcMain.handle('start-picking', async () => {
    try {
        if (!overlayWindow) createPersistentOverlay();

        // 1. Capture
        const imgBuffer = await screenshot({ format: 'png' });
        const dataUrl = `data:image/png;base64,${imgBuffer.toString('base64')}`;

        // 2. Load Image & Show
        overlayWindow.webContents.send('show-overlay', dataUrl);

        // Force TOP-MOST level
        overlayWindow.setAlwaysOnTop(true, 'screen-saver');
        overlayWindow.show();
        overlayWindow.focus();

        // Ensure Main Window is ABOVE overlay
        if (mainWindow) {
            mainWindow.setAlwaysOnTop(true, 'screen-saver');
            mainWindow.moveTop();
        }

    } catch (e) {
        console.error('Capture failed', e);
    }
});

ipcMain.handle('stop-picking', () => {
    if (overlayWindow) {
        overlayWindow.hide();
    }
    if (mainWindow) {
        mainWindow.setAlwaysOnTop(true, 'normal'); // Reset
        mainWindow.focus(); // FOCUS to allow Space-Start
    }
});

// COLOR
ipcMain.handle('color-picked', (event, hex) => {
    if (mainWindow) mainWindow.webContents.send('color-selected', hex);
});

ipcMain.on('hover-color', (event, hex) => {
    if (mainWindow) mainWindow.webContents.send('color-hover', hex);
});

// --- GLOBAL SHORTCUTS ---
app.whenReady().then(() => {
    createWindow();

    // SAFETY NET: ESC closes overlay
    globalShortcut.register('Escape', () => {
        if (overlayWindow && overlayWindow.isVisible()) {
            overlayWindow.hide();
            if (mainWindow) {
                mainWindow.webContents.send('stop-picking-ui');
                mainWindow.setAlwaysOnTop(true, 'normal');
                mainWindow.focus();
            }
        }
    });
});

app.on('will-quit', () => globalShortcut.unregisterAll());

// Fix for windows leaving stray processes
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

// --- AUTO-UPDATE ---
autoUpdater.on('update-available', (info) => {
    dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: 'Mise à jour disponible',
        message: `Une nouvelle version (${info.version}) est disponible !`,
        detail: 'Voulez-vous la télécharger maintenant ?',
        buttons: ['Télécharger', 'Plus tard'],
        defaultId: 0,
        cancelId: 1
    }).then(result => {
        if (result.response === 0) {
            autoUpdater.downloadUpdate();
        }
    });
});

autoUpdater.on('update-downloaded', () => {
    dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: 'Mise à jour prête',
        message: 'La mise à jour a été téléchargée.',
        detail: 'L\'application va redémarrer pour installer la mise à jour.',
        buttons: ['Redémarrer maintenant', 'Plus tard'],
        defaultId: 0,
        cancelId: 1
    }).then(result => {
        if (result.response === 0) {
            autoUpdater.quitAndInstall();
        }
    });
});

autoUpdater.on('error', (err) => {
    console.error('Erreur de mise à jour:', err);
});

// Check for updates after app start (only in production)
app.on('ready', () => {
    if (app.isPackaged) {
        setTimeout(() => {
            autoUpdater.checkForUpdates();
        }, 3000); // Wait 3 seconds after launch
    }
});
