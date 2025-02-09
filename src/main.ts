import { app, BrowserWindow, ipcMain } from "electron";
import registerListeners from "./helpers/ipc/listeners-register";
import path from "path";
import {
  installExtension,
  REACT_DEVELOPER_TOOLS,
} from "electron-devtools-installer";

const inDevelopment = process.env.NODE_ENV === "development";

// Initialize store
let store: any = null;

// Initialize store using dynamic import
const initStore = async () => {
  const { default: Store } = await import('electron-store');
  store = new Store({
    name: 'chat-sessions',
    defaults: {
      sessions: []
    }
  });
};

// Initialize store before setting up IPC handlers
initStore().then(() => {
  // Handle store operations
  ipcMain.handle('store-get', (_, key) => {
    return store.get(key);
  });

  ipcMain.handle('store-set', (_, key, value) => {
    store.set(key, value);
    return true;
  });
});

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      webSecurity: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });
  registerListeners(mainWindow);

  // Add comprehensive CSP headers
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self'; " +
          "script-src 'self' 'unsafe-eval' 'unsafe-inline'; " +
          "style-src 'self' 'unsafe-inline'; " +
          "connect-src 'self' http: https: ws: wss:; " +
          "img-src 'self' data: https:; " +
          "worker-src blob: 'self';"
        ]
      }
    });
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

async function installExtensions() {
  try {
    const result = await installExtension(REACT_DEVELOPER_TOOLS);
    console.log(`Extensions installed successfully: ${result.name}`);
  } catch {
    console.error("Failed to install extensions");
  }
}

// Wait for store initialization before creating window
app.whenReady()
  .then(() => initStore())
  .then(() => createWindow())
  .then(() => installExtensions());

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
