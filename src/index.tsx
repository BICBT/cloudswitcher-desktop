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
import { BrowserRouter } from "react-router-dom";
import axios from "axios";
import { Container } from 'typedi';
import { ServiceManager } from './service/ServiceManager';

//request interceptor to add token in header
axios.interceptors.request.use(function (config) {
  const token = localStorage.getItem('token');
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
  const serviceManager = Container.get(ServiceManager);
  await serviceManager.initializeAll();

ReactDOM.render(
  <ChakraProvider>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </ChakraProvider>,
  document.getElementById('root')
);

  // If you want your app to work offline and load faster, you can change
  // unregister() to register() below. Note this comes with some pitfalls.
  // Learn more about service workers: https://bit.ly/CRA-PWA
  serviceWorker.unregister();
})();
