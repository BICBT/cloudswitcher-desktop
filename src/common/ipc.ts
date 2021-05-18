import { SimpleEvent } from './event';
import { ipcRenderer, webContents } from "electron";
import { as, isMainProcess } from './util';

export interface IpcMessage {
  sessionId: string;
  serviceName: string;
  method: string;
  args: any[];
}

export interface IpcResult {
  sessionId: string;
  result?: unknown;
  error?: unknown;
}

export interface IpcEventMessage {
  eventName: string;
  data: any;
}

export const IpcMessageChannel = 'ipc-message';
export const IpcResultChannel = 'ipc-result';
export const IpcEventChannel = 'ipc-event';

export interface IpcHandler {
  executeInMainProcess(service: any, method: string, args: any[]): Promise<void>
}

let ipcHandler: IpcHandler | undefined;

export function registerIpcHandler(handler: IpcHandler) {
  ipcHandler = handler;
}

export function ExecuteInMainProcess() {
  return function(target: unknown, property: string, descriptor: PropertyDescriptor) {
    const origin = descriptor.value;
    descriptor.value = function (...args: any[]) {
      if (isMainProcess()) {
        return origin.apply(this, args);
      } else {
        if (!ipcHandler) {
          throw new Error(`IpcHandler can't be empty`);
        }
        return ipcHandler.executeInMainProcess(this, property, args);
      }
    };
  };
}

export class IpcEvent<T> extends SimpleEvent<T> {

  public constructor(private readonly eventName: string) {
    super();
    if (!isMainProcess()) {
      ipcRenderer.on(IpcEventChannel, (event, message: IpcEventMessage) => {
        if (message.eventName === this.eventName) {
          super.emit(message.data);
        }
      });
    }
  }

  public emit(data: T): void {
    super.emit(data);
    if (isMainProcess()) {
      webContents.getAllWebContents().forEach(webContents => {
        webContents.send(IpcEventChannel, as<IpcEventMessage>({
          eventName: this.eventName,
          data: data,
        }));
      });
    }
  }
}
