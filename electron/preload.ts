import { contextBridge, ipcRenderer } from 'electron';

// Expose store methods to renderer through IPC
contextBridge.exposeInMainWorld('electronStore', {
  get: (key: string) => ipcRenderer.invoke('electron-store-get', key),
  set: (key: string, value: any) => ipcRenderer.invoke('electron-store-set', key, value),
}); 