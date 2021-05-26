import { app, remote } from 'electron';

export function as<T>(value: T): T {
  return value;
}

export function notNull<T>(value: T | null | undefined): T {
  if (value === null || value === undefined) {
    throw new Error(`value should not be empty`);
  }
  return value;
}

export function removeKey<T extends object, K extends keyof T>(object: T, key: K): Omit<T, K> {
  const { [key]: deleted, ...rest } = object;
  return rest;
}

export function isMainProcess() {
  return !(process && process.type === 'renderer');
}

export function isMainWindow() {
  if (isMainProcess()) {
    return false;
  }
  const url = new URL(window.location.href);
  return url.searchParams.get('window') === 'main';
}

export function isDialogWindow() {
  if (isMainProcess()) {
    return false;
  }
  const url = new URL(window.location.href);
  return url.searchParams.get('window') === 'dialog';
}

export function isExternalWindow() {
  if (isMainProcess()) {
    return false;
  }
  const url = new URL(window.location.href);
  return url.searchParams.get('window') === 'external';
}

export enum OS {
  Windows = 'win32',
  Mac = 'darwin',
}

export function getOS() {
  return process.platform as OS;
}

export function isMac(): boolean {
  return getOS() === OS.Mac;
}

export function sequence(start: number, end: number): number[] {
  const sequence: number[] = [];
  for (let i = start; i <= end; ++i) {
    sequence.push(i);
  }
  return sequence;
}

export function getCurrentDisplay() {
  const bounds = remote.getCurrentWindow().getBounds();
  return remote.screen.getDisplayMatching(bounds);
}

export function replaceUrlParams(url: string, params: object) {
  Object.entries(params).forEach(([key, value]) => {
    url = url.replace(`:${key}`, value);
  });
  return url;
}

export function replaceItem<T>(array: T[], newItem: T, find: (oldItem: T) => boolean): T[] {
  return array.map(oldItem => find(oldItem) ? newItem : oldItem);
}

export function isLocal() {
  return !(app || remote.app).isPackaged;
}
