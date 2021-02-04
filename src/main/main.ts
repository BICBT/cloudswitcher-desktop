import 'reflect-metadata';
import * as isDev from 'electron-is-dev';
import * as path from 'path';
import * as os from 'os';
import * as dotenv from 'dotenv';

// TODO: load env from local path when in the production, remove this in the future
if (!isDev) {
  dotenv.config({ path: path.join(__dirname, '../server.env') });
}

import { app, BrowserWindow, ipcMain } from 'electron';
import { Container } from 'typedi';
import { SourceService } from './service/sourceService';
import { AtemService } from './service/atemService';
import { ATEM_DEVICE_IP, ENABLE_ATEM } from '../common/constant';
import { BoserService } from "./service/boserService";
import { ENABLE_BOSER } from '../common/constant'
import { ObsService } from './service/obsService';
import { AudioService } from './service/audioService';

const loadUrl = isDev ? 'http://localhost:3000' : `file://${path.join(__dirname, '../index.html')}`;
const sourceService = Container.get(SourceService);
const atemService = Container.get(AtemService);
const boserService = Container.get(BoserService);
const obsService = Container.get(ObsService);
const audioService = Container.get(AudioService);

let mainWindow: BrowserWindow | undefined;
let dialogWindow: BrowserWindow | undefined;
let externalWindow: BrowserWindow | undefined;

async function startApp() {
  await sourceService.initialize();
  await audioService.initialized();
  if (ENABLE_ATEM) {
    await atemService.initialize(ATEM_DEVICE_IP);
  }
  if (ENABLE_BOSER) {
    await boserService.initialize();
  }

  // Main window
  mainWindow = new BrowserWindow({
    maximizable: true,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
    }
  });
  mainWindow.removeMenu();
  mainWindow.loadURL(`${loadUrl}?window=main`);
  mainWindow.setFullScreen(true);
  mainWindow.on('closed', () => {
    obsService.close();
    app.exit(0);
  });

  // shortcuts
  mainWindow.webContents.on('before-input-event', (event, input) => {
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '='].forEach((key, index) => {
      if (input.key === key) {
        if (input.control) {
          sourceService.previewByIndex(index);
        } else {
          sourceService.takeByIndex(index);
        }
      }
    });
  });


  // Dialog window
  dialogWindow = new BrowserWindow({
    parent: mainWindow,
    modal: true,
    frame: false,
    titleBarStyle: 'hidden',
    show: false,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
    },
  });
  dialogWindow.removeMenu();
  dialogWindow.loadURL(`${loadUrl}?window=dialog`);
  dialogWindow.on('close', e => {
    // Prevent the window from actually closing
    e.preventDefault();
  });
}

// Fix windows scale factor
if (os.platform() === 'win32') {
  app.commandLine.appendSwitch('high-dpi-support', '1');
  app.commandLine.appendSwitch('force-device-scale-factor', '1');
}

app.on('ready', startApp);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    startApp();
  }
});

// Show renderer log in main
const color = (str: string) => `\x1b[35m${str}\x1b[0m`;
ipcMain.on('logMsg', (event, level, message, ...args) => {
  (console as any)[level](`${color('[renderer]')}${message}`, args);
});

// Dialog
ipcMain.on('showDialog', (event, sessionId, options, defaultValue) => {
  if (dialogWindow) {
    dialogWindow.webContents.send('showDialog', sessionId, options, defaultValue);
  }
});

ipcMain.on('dialogClosed', (event, sessionId, result) => {
  mainWindow?.webContents.send('dialogClosed', sessionId, result);
});

// Open DevTools
ipcMain.on('openDevTools', () => {
  mainWindow?.webContents.openDevTools();
});

// External window
ipcMain.on('showExternalWindow', (event, layouts) => {
  if (externalWindow) {
    externalWindow.show();
    externalWindow.webContents.send('layoutsUpdated', layouts);
  } else {
    externalWindow = new BrowserWindow({
      width: 960,
      height: 540,
      webPreferences: {
        nodeIntegration: true,
        enableRemoteModule: true,
      }
    });
    externalWindow.removeMenu();
    externalWindow.loadURL(`${loadUrl}?window=external&layouts=${layouts}`);
    externalWindow.on('close', e => {
      externalWindow = undefined;
    });
  }
});

// Exit
ipcMain.on('exit', () => {
  mainWindow?.close();
});
