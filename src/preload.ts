import { contextBridge, ipcRenderer } from 'electron';

// Expose store functionality to renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  store: {
    get: (key: string) => ipcRenderer.invoke('store-get', key),
    set: (key: string, value: any) => ipcRenderer.invoke('store-set', key, value),
  }
});
