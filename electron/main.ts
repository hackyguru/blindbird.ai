import { app, BrowserWindow, ipcMain } from 'electron';
import { store } from './store';

// Handle store operations
ipcMain.handle('electron-store-get', (_event, key) => {
  return store.get(key);
});

ipcMain.handle('electron-store-set', (_event, key, value) => {
  store.set(key, value);
}); 