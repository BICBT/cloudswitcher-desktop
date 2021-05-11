import * as path from 'path';
import * as isDev from 'electron-is-dev';
import * as dotenv from 'dotenv';

// load env files for production package
if (!isDev) {
  const p = path.resolve(path.basename(process.execPath), 'resources/app/build/.env');
  console.log(`Load config from ${p}`);
  dotenv.config({ path: p });
}

export const OBS_SERVER_URL = process.env.REACT_APP_OBS_SERVER_URL || '';

export const MEDIA_BASE_URL = process.env.REACT_APP_MEDIA_BASE_URL || '';

export const ENABLE_PANEL = process.env.REACT_APP_ENABLE_PANEL === 'true';

export const SOURCE_COUNT = 12;

export const AUTH_BASE_URL = process.env.REACT_APP_AUTH_BASE_URL || '';

export const SWITCHER_BASE_URL = process.env.REACT_APP_SWITCHER_BASE_URL || '';
