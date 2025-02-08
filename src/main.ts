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
  const preload = path.join(__dirname, "preload.js");
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    center: true,
    title: "WakuAI",
    backgroundColor: '#ffffff',
    webPreferences: {
      devTools: inDevelopment,
      contextIsolation: true,
      nodeIntegration: false,
      nodeIntegrationInSubFrames: false,
      preload: preload,
    },
    titleBarStyle: "hiddenInset",
  });
  registerListeners(mainWindow);

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
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
