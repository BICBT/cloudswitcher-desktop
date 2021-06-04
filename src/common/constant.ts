import * as path from 'path';
import isDev from 'electron-is-dev';
import * as dotenv from 'dotenv';
import { isLocal } from './util';

// load env files for production package
if (!isDev) {
  const p = isLocal() ? path.resolve(process.cwd(), 'build/.env') : path.resolve(process.resourcesPath, 'app/build/.env');
  console.log(`Load config from ${p}`);
  dotenv.config({ path: p });
}

export const AUTH_BASE_URL = process.env.REACT_APP_AUTH_BASE_URL || '';

export const SWITCHER_BASE_URL = process.env.REACT_APP_SWITCHER_BASE_URL || '';

export const MEDIA_BASE_URL = process.env.REACT_APP_MEDIA_BASE_URL || '';

export const SOURCE_COUNT = 12;

export const SENTRY_DSN = 'https://e198225ab25c41f6ac2660f9e72c715d@o789714.ingest.sentry.io/5800033';
