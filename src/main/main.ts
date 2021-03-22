import 'reflect-metadata';
import * as path from 'path';
import * as os from 'os';
import { app, BrowserWindow, ipcMain } from 'electron';
import * as isDev from 'electron-is-dev';
import * as SegfaultHandler from 'segfault-handler';
import { isMac } from '../common/util';
import { Container } from 'typedi';
import { SourceService } from '../service/SourceService';
import { ObsService } from '../service/ObsService';
import { ServiceManager } from '../service/ServiceManager';

// register segfault handler
SegfaultHandler.registerHandler("crash.log", function(signal, address, stack) {
  console.log(`Native crash appeared: ${stack}`);
});

const title = `CloudSwitcher`;
const loadUrl = isDev ? 'http://localhost:3000' : `file://${path.join(__dirname, '../index.html')}`;

let mainWindow: BrowserWindow | undefined;
let dialogWindow: BrowserWindow | undefined;
let externalWindow: BrowserWindow | undefined;

const serviceManager = Container.get(ServiceManager);
const sourceService = Container.get(SourceService);
const obsService = Container.get(ObsService);

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
  await serviceManager.initializeAll();
  mainWindow = new BrowserWindow({
    title: title,
    maximizable: true,
    width: 450,
    height: 550,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
    }
  });
  mainWindow.removeMenu();
  mainWindow.loadURL(`${loadUrl}?window=main`);
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
  if (isDev) {
    mainWindow.webContents.on('before-input-event', (event, input) => {
      if (input.key === 'F12') {
        mainWindow?.webContents.openDevTools();
      }
    });
  }


  if (isDev) {
    mainWindow.webContents.on('before-input-event', (event, input) => {
      if (input.key === 'F12') {
        openDevTools();
      }
    });
  }
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

// Dialog window
ipcMain.on('showDialog', async (event, sessionId, options, defaultValue) => {
  if (dialogWindow) {
    dialogWindow?.webContents.send('showDialog', sessionId, options, defaultValue);
    dialogWindow.show();
  } else {
    // noinspection RedundantConditionalExpressionJS
    dialogWindow = new BrowserWindow({
      title: title,
      parent: isMac() ? undefined : mainWindow,
      modal: isMac() ? false : true,
      frame: false,
      titleBarStyle: 'hidden',
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

// Show renderer log in main
const color = (str: string) => `\x1b[35m${str}\x1b[0m`;
ipcMain.on('logMsg', (event, level, windowName, message, ...args) => {
  (console as any)[level](`${color(`[${windowName}]`)}${message}`, args);
});

// Open DevTools
ipcMain.on('openDevTools', () => {
  openDevTools();
});

// Exit
ipcMain.on('exit', () => {
  mainWindow?.close();
});
