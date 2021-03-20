import "reflect-metadata";
import '@fortawesome/fontawesome-free/css/all.css';
import './index.scss';
import 'antd/dist/antd.css';
import React from 'react';
import ReactDOM from 'react-dom';
import { ipcRenderer, remote } from 'electron';
import * as serviceWorker from './serviceWorker';
import { App } from './App';
import { ChakraProvider } from '@chakra-ui/react';
import { isMainWindow, isWorkerWindow } from './common/util';
import * as isDev from 'electron-is-dev';
import { Container } from 'typedi';
import { ServiceManager } from './service/ServiceManager';
import { SourceService } from './service/SourceService';

const serviceManager = Container.get(ServiceManager);

// Output log in main process
['log', 'debug', 'info', 'warn', 'errpr'].forEach(level => {
  const origin = (console as any)[level];
  (console as any)[level] = (message: string, ...args: any) => {
    origin(message, ...args);
    ipcRenderer.send('logMsg', level, message, ...args);
  }
});

// shortcuts
if (isMainWindow()) {
  const sourceService = Container.get(SourceService);
  remote.getCurrentWebContents().on('before-input-event', (event, input) => {
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '='].forEach(async (key, index) => {
      if (input.key === key) {
        if (input.control) {
          await sourceService.previewByIndex(index);
        } else {
          await sourceService.takeByIndex(index);
        }
      }
    });
  });
  if (isDev) {
    remote.getCurrentWebContents().on('before-input-event', (event, input) => {
      if (input.key === 'F12') {
        ipcRenderer.send('openDevTools');
      }
    });
  }
}

// Initialized
(async () => {
  await serviceManager.initAll();

  if (isWorkerWindow()) {
    ipcRenderer.send('workerInitialized');
    return;
  } else {
    ReactDOM.render(
      <ChakraProvider>
        <App/>
      </ChakraProvider>,
      document.getElementById('root')
    );

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
    serviceWorker.unregister();
  }
})();
