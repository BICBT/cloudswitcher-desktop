import * as isDev from 'electron-is-dev';

export const OBS_SERVER_URL = isDev ? process.env.REACT_APP_OBS_SERVER_URL : '47.92.50.109:50051'; // TODO: read from env

export const OBS_SHOW_NAME = 'b31d4762-5d59-4b5f-ab5e-c0f6761d26b9';