import { Container, Service } from 'typedi';
import { ipcRenderer } from 'electron';
import { as, broadcastMessage, isWorkerWindow } from '../common/util';
import * as uuid from 'uuid';
import { SimpleEvent } from '../common/event';
import { ServiceBase, ServiceManager, ServiceName } from './ServiceManager';

export interface IpcMessage {
  sessionId: string;
  serviceName: ServiceName;
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

export function ExecuteInWorkerProcess() {
  const serviceManager = Container.get(ServiceManager);
  const ipcService = Container.get(IpcService);
  return function(target: unknown, property: string, descriptor: PropertyDescriptor) {
    descriptor.value = (...args: any[]) => {
      if (isWorkerWindow()) {
        return descriptor.value.apply(target, args);
      } else {
        if (!(target instanceof ServiceBase)) {
          throw new Error(`target is not a instance of ServiceBase`);
        }
        const serviceName = serviceManager.getServiceName(target);
        if (!serviceName) {
          throw new Error(`service name not found`);
        }
        return ipcService.executeInWorkerProcess(serviceName, property, args);
      }
    };
  };
}

export class IpcEvent<T> extends SimpleEvent<T> {

  public constructor(private readonly eventName: string) {
    super();
    ipcRenderer.on(IpcEventChannel, (event, message: IpcEventMessage) => {
      if (message.eventName === this.eventName) {
        super.emit(message.data);
      }
    });
  }

  public emit(data: T): void {
    broadcastMessage(IpcEventChannel, as<IpcEventMessage>({
      eventName: this.eventName,
      data: data,
    }));
  }
}

@Service()
export class IpcService extends ServiceBase {
  private readonly resolvers: Map<string, Resolver> = new Map<string, Resolver>();
  private readonly serviceManager = Container.get(ServiceManager);

  public async init(): Promise<void> {
    if (isWorkerWindow()) {
      // handle message
      ipcRenderer.on(IpcMessageChannel, async (event, message: IpcMessage) => {
        const service = this.serviceManager.getService(message.serviceName);
        if (!service) {
          throw new Error(`Service ${message.serviceName} not existed.`);
        }
        try {
          let result = ((service as any)[message.method] as Function).apply(service, message.args);
          if (result instanceof Promise) {
            result = await result;
          }
          ipcRenderer.send(IpcResultChannel, as<IpcResult>({
            sessionId: message.sessionId,
            result: result,
          }));
        } catch (e: unknown) {
          ipcRenderer.send(IpcResultChannel, as<IpcResult>({
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

  public executeInWorkerProcess(serviceName: ServiceName, method: string, args: any[]): Promise<void> {
    const sessionId = uuid.v4();
    ipcRenderer.send(IpcMessageChannel, as<IpcMessage>({
      sessionId: sessionId,
      serviceName: serviceName,
      method: method,
      args: args,
    }));
    return new Promise((resolve, reject) => {
      this.resolvers.set(sessionId, { resolve, reject });
    });
  }
}
