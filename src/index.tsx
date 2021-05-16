import "reflect-metadata";
import '@fortawesome/fontawesome-free/css/all.css';
import './index.scss';
import 'antd/dist/antd.css';
import React from 'react';
import ReactDOM from 'react-dom';
import { ipcRenderer } from 'electron';
import * as serviceWorker from './serviceWorker';
import { App } from './App';
import { ChakraProvider } from '@chakra-ui/react';
import { HashRouter } from "react-router-dom";
import axios from "axios";
import { Container } from 'typedi';
import { DialogService } from './service/DialogService';
import { IpcService } from './service/IpcService';
import { StorageService } from './service/StorageService';

const dialogService = Container.get(DialogService);
const ipcService = Container.get(IpcService);
const storageService = Container.get(StorageService);

//request interceptor to add token in header
axios.interceptors.request.use(async config => {
  const token = await storageService.getToken();
  if (token) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, function (error) {
  return Promise.reject(error);
});

// Output log in main process
const url = new URL(window.location.href);
const windowName = url.searchParams.get('window');
['log', 'debug', 'info', 'warn', 'error'].forEach(level => {
  const origin = (console as any)[level];
  (console as any)[level] = (message: string, ...args: any) => {
    origin(message, ...args);
    ipcRenderer.send('logMsg', level, windowName, message, ...args);
  }
});

(async () => {
  await ipcService.initialize();
  await dialogService.initialize();

  ReactDOM.render(
    <ChakraProvider>
      <HashRouter>
        <App />
      </HashRouter>
    </ChakraProvider>,
    document.getElementById('root')
  );

  // If you want your app to work offline and load faster, you can change
  // unregister() to register() below. Note this comes with some pitfalls.
  // Learn more about service workers: https://bit.ly/CRA-PWA
  serviceWorker.unregister();
})();
