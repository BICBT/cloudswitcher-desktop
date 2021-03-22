import { Container, Service } from 'typedi';
import { ipcMain, ipcRenderer, webContents } from 'electron';
import * as uuid from 'uuid';
import { as, isMainProcess } from '../common/util';
import { SimpleEvent } from '../common/event';
import { ServiceBase } from './ServiceBase';

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

export interface Resolver {
  resolve: (result: any)  => void;
  reject: (error: any) => void;
}

const IpcMessageChannel = 'ipc-message';
const IpcResultChannel = 'ipc-result';
const IpcEventChannel = 'ipc-event';

export function ExecuteInMainProcess() {
  return function(target: unknown, property: string, descriptor: PropertyDescriptor) {
    const origin = descriptor.value;
    descriptor.value = function (...args: any[]) {
      if (isMainProcess()) {
        return origin.apply(this, args);
      } else {
        return Container.get(IpcService).executeInMainProcess(this, property, args);
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

@Service()
export class IpcService extends ServiceBase {
  private readonly resolvers: Map<string, Resolver> = new Map<string, Resolver>();
  private readonly services: object[] = [];

  public async initialize(): Promise<void> {
    if (isMainProcess()) {
      // handle message
      ipcMain.on(IpcMessageChannel, async (event, message: IpcMessage) => {
        try {
          const service = this.services.find(s => s.constructor.name === message.serviceName);
          if (!service) {
            // noinspection ExceptionCaughtLocallyJS
            throw new Error(`Service ${message.serviceName} not existed.`);
          }
          let result = ((service as any)[message.method] as Function).apply(service, message.args);
          if (!(result instanceof Promise)) {
            // noinspection ExceptionCaughtLocallyJS
            throw new Error(`Method execute in main should always return Promise.`);
          }
          result = await result;
          event.sender.send(IpcResultChannel, as<IpcResult>({
            sessionId: message.sessionId,
            result: result,
          }));
        } catch (e: unknown) {
          console.error(`Failed to execute ipc message`, e);
          event.sender.send(IpcResultChannel, as<IpcResult>({
            sessionId: message.sessionId,
            error: e,
          }));
        }
      });
    } else {
      // handle message result
      ipcRenderer.on(IpcResultChannel, (event, result: IpcResult) => {
        const resolver = this.resolvers.get(result.sessionId);
        if (resolver) {
          if (result.error) {
            resolver.reject(result.error);
          } else {
            resolver.resolve(result.result);
          }
        }
      });
    }
  }

  public registerServices(services: object[]) {
    this.services.push(...services);
  }

  public executeInMainProcess(service: any, method: string, args: any[]): Promise<void> {
    const sessionId = uuid.v4();
    ipcRenderer.send(IpcMessageChannel, as<IpcMessage>({
      sessionId: sessionId,
      serviceName: service.constructor.name,
      method: method,
      args: args,
    }));
    return new Promise((resolve, reject) => {
      this.resolvers.set(sessionId, { resolve, reject });
    });
  }
}
