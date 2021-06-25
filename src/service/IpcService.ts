import { Container, Service } from 'typedi';
import { ipcMain, ipcRenderer } from 'electron';
import * as uuid from 'uuid';
import { as, isMainProcess } from '../common/util';
import { IpcHandler, IpcMessage, IpcMessageChannel, IpcResult, IpcResultChannel, registerIpcHandler } from '../common/ipc';
import { ObsService } from './ObsService';
import { CGService } from './CGService';
import { SourceService } from './SourceService';
import { SwitcherService } from './SwitcherService';
import { OutputService } from './OutputService';
import { AudioService } from './AudioService';
import { PreviewService } from './PreviewService';
import { StorageService } from './StorageService';
import { UpdateService } from "./UpdateService";

interface Resolver {
  resolve: (result: any)  => void;
  reject: (error: any) => void;
}

const IpcServices: Record<string, object> = {
  'ObsService': Container.get(ObsService),
  'CGService': Container.get(CGService),
  'SourceService': Container.get(SourceService),
  'SwitcherService': Container.get(SwitcherService),
  'OutputService': Container.get(OutputService),
  'AudioService': Container.get(AudioService),
  'PreviewService': Container.get(PreviewService),
  'StorageService': Container.get(StorageService),
  'UpdateService': Container.get(UpdateService),
};

@Service()
export class IpcService implements IpcHandler {
  private readonly resolvers: Map<string, Resolver> = new Map<string, Resolver>();

  public async initialize(): Promise<void> {
    registerIpcHandler(this);
    if (isMainProcess()) {
      // handle message
      ipcMain.on(IpcMessageChannel, async (event, message: IpcMessage) => {
        try {
          const service = IpcServices[message.serviceName];
          if (!service) {
            // noinspection ExceptionCaughtLocallyJS
            throw new Error(`Service ${message.serviceName} is not registered in the IpcService.`);
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

  public executeInMainProcess(service: any, method: string, args: any[]): Promise<void> {
    const sessionId = uuid.v4();
    const serviceName = Object.keys(IpcServices).find(key => IpcServices[key] === service);
    if (!serviceName) {
      throw new Error(`${service.constructor.name} is not registered in the IpcServices.`);
    }
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
