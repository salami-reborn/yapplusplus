const { contextBridge, ipcRenderer } = require('electron');

const preloadPathArg = process.argv.find(arg => arg.startsWith('--preload-path='));
const preloadPath = preloadPathArg ? preloadPathArg.split('=')[1] : '';

contextBridge.exposeInMainWorld('electronAPI', {
    yaplayStart: (session, port) => ipcRenderer.invoke('yaplay-start', session, port),
    yaplayExchange: (session, snapshot, notices, call) => ipcRenderer.invoke('yaplay-exchange', session, snapshot, notices, call),
    yaplayStop: (session) => ipcRenderer.invoke('yaplay-stop', session),
    getPlugins: () => ipcRenderer.invoke('get-plugins'),
    getAsset: (assetName) => ipcRenderer.invoke('get-asset', assetName),
    update: () => ipcRenderer.invoke('update'),
    getPreloadPath: () => preloadPath,
    restartApp: () => ipcRenderer.invoke('restart-app'),
    getTheme: (name) => ipcRenderer.invoke('get-theme', name),
    getThemes: () => ipcRenderer.invoke('get-themes'),
    saveCustomPlugin: (filename, code) => ipcRenderer.invoke('save-custom-plugin', filename, code),
    openExternal: (url) => ipcRenderer.invoke('open-external', url),
    fetchYapmodRelease: () => ipcRenderer.invoke('fetch-yapmod-release'),
    runYapmodClient: (source) => ipcRenderer.invoke('run-yapmod-client', source),
    stopYapmodClient: () => ipcRenderer.invoke('stop-yapmod-client')
});
