const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    minimize: () => ipcRenderer.invoke('minimize-app'),
    close: () => ipcRenderer.invoke('close-app'),
    setMode: (mode) => ipcRenderer.invoke('set-mode', mode),
    moveWindow: (x, y) => ipcRenderer.send('window-move', { x, y }),

    // Picking Methods
    startPicking: () => ipcRenderer.invoke('start-picking'),
    stopPicking: () => ipcRenderer.invoke('stop-picking'),
    colorPicked: (hex) => ipcRenderer.invoke('color-picked', hex),
    sendHoverColor: (hex) => ipcRenderer.send('hover-color', hex),

    // Listeners
    onShowOverlay: (callback) => ipcRenderer.on('show-overlay', (event, url) => callback(url)),
    onColorSelected: (callback) => ipcRenderer.on('color-selected', (event, hex) => callback(hex)),
    onColorHover: (callback) => ipcRenderer.on('color-hover', (event, hex) => callback(hex)),

    // NEW: Sync UI state when picking stops externally (Esc key)
    onStopPickingUI: (callback) => ipcRenderer.on('stop-picking-ui', () => callback())
});
