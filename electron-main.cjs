// Electron Main Process for Rajsamand District Assessment Portal
// Production-ready Windows .EXE Desktop Wrapper

const { app, BrowserWindow, Menu, shell, ipcMain } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1360,
    height: 880,
    minWidth: 1024,
    minHeight: 700,
    title: 'Rajsamand District Assessment Portal - Govt. of Rajasthan',
    icon: path.join(__dirname, 'public/favicon.svg'),
    backgroundColor: '#0f172a',
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
    },
  });

  // Load production build or development server
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist/index.html'));
  }

  // Handle external links in native browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Enable kiosk/lock-down mode for strict assessment supervision if requested
ipcMain.on('enable-kiosk-mode', () => {
  if (mainWindow) {
    mainWindow.setKiosk(true);
    mainWindow.setAlwaysOnTop(true, 'screen-saver');
  }
});

ipcMain.on('disable-kiosk-mode', () => {
  if (mainWindow) {
    mainWindow.setKiosk(false);
    mainWindow.setAlwaysOnTop(false);
  }
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
