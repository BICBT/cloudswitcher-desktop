import 'reflect-metadata';
import * as path from 'path';
import * as os from 'os';
import { Container } from 'typedi';
import { app, BrowserWindow, ipcMain } from 'electron';
import isDev from 'electron-is-dev';
import * as Sentry from '@sentry/electron';
import { ENV, SENTRY_DSN } from '../common/constant';

// Add sentry before any application code
Sentry.init({
  dsn: SENTRY_DSN,
  debug: true,
  environment: isDev ? 'dev' : 'prod',
});

import { isMac } from '../common/util';
import { SourceService } from '../service/SourceService';
import { ObsService } from '../service/ObsService';
import { AudioService } from '../service/AudioService';
import { BoserService } from '../service/BoserService';
import { CGService } from '../service/CGService';
import { IpcService } from '../service/IpcService';
import { OutputService } from '../service/OutputService';
import { UpdateService } from "../service/UpdateService";

let title = `Cloud Switcher`;
if (ENV === 'dev') {
  title += ' (Development)'
} else if (ENV === 'test') {
  title += ' (Test)'
}
const loadUrl = isDev ? 'http://localhost:3000' : `file://${path.join(__dirname, '../index.html')}`;

let mainWindow: BrowserWindow | undefined;
let dialogWindow: BrowserWindow | undefined;
let externalWindow: BrowserWindow | undefined;

const ipcService = Container.get(IpcService);
const obsService = Container.get(ObsService);
const sourceService = Container.get(SourceService);
const outputService = Container.get(OutputService);
const audioService = Container.get(AudioService);
const boserService = Container.get(BoserService);
const cgService = Container.get(CGService);
const updateService = Container.get(UpdateService);
let initialized = false;

function openDevTools() {
  mainWindow?.webContents.openDevTools();
  dialogWindow?.webContents.openDevTools();
  externalWindow?.webContents.openDevTools();
}

async function startApp() {
  if (!app.requestSingleInstanceLock()) {
    app.quit()
    return;
  }

  await ipcService.initialize();
  await updateService.initialize();

  // main window
  mainWindow = new BrowserWindow({
    title: title,
    maximizable: true,
    width: 500,
    height: 600,
    show: false,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
    }
  });
  mainWindow.removeMenu();
  await mainWindow.loadURL(`${loadUrl}?window=main`);
  mainWindow.on('closed', () => {
    if (initialized) {
      obsService.close();
    }
    app.exit(0);
  });

  if (isDev) {
    mainWindow?.webContents.on('before-input-event', (event, input) => {
      if (input.type === 'keyDown' && input.key === 'F12') {
        openDevTools();
      }
    });
  }

  // dialog window
  dialogWindow = new BrowserWindow({
    title: title,
    parent: isMac() ? undefined : mainWindow,
    modal: true,
    fullscreen: false,
    frame: false,
    titleBarStyle: 'hidden',
    show: false,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
    },
  });
  dialogWindow.removeMenu();
  await dialogWindow.loadURL(`${loadUrl}?window=dialog`);
  dialogWindow.on('close', e => {
    // Prevent the window from actually closing
    e.preventDefault();
  });
}

async function initialize() {
  // initialize
  await obsService.initialize();
  await sourceService.initialize();
  await outputService.initialize();
  await audioService.initialize();
  await boserService.initialize();
  await cgService.initialize();

  // shortcuts
  mainWindow?.webContents.on('before-input-event', (event, input) => {
    if (input.type === 'keyDown') {
      ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '='].forEach(async (key, index) => {
        if (input.key === key) {
          if (input.control) {
            await sourceService.previewByIndex(index);
          } else {
            await sourceService.takeByIndex(index);
          }
        }
      });
    }
  });

  initialized = true;
  mainWindow?.webContents.send('initialized');
}

app.allowRendererProcessReuse = false;
if (os.platform() === 'win32') {
  app.commandLine.appendSwitch('high-dpi-support', '1');
  app.commandLine.appendSwitch('force-device-scale-factor', '1');
}

app.on('ready', () => startApp());

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', async () => {
  if (mainWindow === null) {
    await startApp();
  }
});

// Initialize
ipcMain.on('switcherSelected', async () => await initialize());

// Dialog window
ipcMain.on('showDialog', async (event, sessionId, options, defaultValue) => {
  dialogWindow?.webContents.send('showDialog', sessionId, options, defaultValue);
  dialogWindow?.show();
});

ipcMain.on('dialogClosed', (event, sessionId, result) => {
  mainWindow?.webContents.send('dialogClosed', sessionId, result);
});

// External window
ipcMain.on('showExternalWindow', async (event, layouts) => {
  if (externalWindow) {
    externalWindow.webContents.send('layoutsUpdated', layouts);
    externalWindow.show();
  } else {
    externalWindow = new BrowserWindow({
      title: title,
      width: 960,
      height: 540,
      webPreferences: {
        nodeIntegration: true,
        enableRemoteModule: true,
      }
    });
    externalWindow.removeMenu();
    await externalWindow.loadURL(`${loadUrl}?window=external&layouts=${layouts}`);
    externalWindow.on('close', () => {
      externalWindow = undefined;
    });
  }
});

// Show renderer log in main process
const color = (str: string) => `\x1b[35m${str}\x1b[0m`;
ipcMain.on('logMsg', (event, level, windowName, message, ...args) => {
  (console as any)[level](`${color(`[${windowName}]`)}${message}`, args);
});

// Open devtools
ipcMain.on('openDevTools', () => {
  openDevTools();
});

// Exit
ipcMain.on('exit', () => {
  mainWindow?.close();
});
