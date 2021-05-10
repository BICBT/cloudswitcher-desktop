import 'reflect-metadata';
import * as path from 'path';
import * as os from 'os';
import * as dotenv from 'dotenv';
import { app, BrowserWindow, ipcMain } from 'electron';
import * as isDev from 'electron-is-dev';
import * as SegfaultHandler from 'segfault-handler';
import { Container } from 'typedi';
import { isMac } from '../common/util';
import { SourceService } from '../service/SourceService';
import { ObsService } from '../service/ObsService';
import { AudioService } from '../service/AudioService';
import { BoserService } from '../service/BoserService';
import { CGService } from '../service/CGService';
import { IpcService } from '../service/IpcService';
import { OutputService } from '../service/OutputService';
import { SwitcherService } from '../service/SwitcherService';
import { PreviewService } from '../service/PreviewService';

// register segfault handler
SegfaultHandler.registerHandler("crash.log", function(signal, address, stack) {
  console.log(`Native crash appeared: ${stack}`);
});

// load env files in production package
if (!isDev) {
  dotenv.config({ path: path.join(__dirname, '../.env') });
}

const title = `Cloud Switcher`;
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
const switcherService = Container.get(SwitcherService);
const previewService = Container.get(PreviewService);
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
  ipcService.registerServices([
    obsService,
    cgService,
    sourceService,
    switcherService,
    outputService,
    audioService,
    previewService,
  ]);
  await ipcService.initialize();

  // main window
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
  await mainWindow.loadURL(`${loadUrl}?window=main`);
  mainWindow.on('closed', () => {
    if (initialized) {
      obsService.close();
    }
    app.exit(0);
  });

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
  if (isDev) {
    mainWindow?.webContents.on('before-input-event', (event, input) => {
      if (input.type === 'keyDown' && input.key === 'F12') {
        openDevTools();
      }
    });
  }

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
