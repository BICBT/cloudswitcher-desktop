import { Service } from 'typedi';
import { BrowserWindow } from 'electron';
import * as obs from 'obs-node';
import { ServiceBase } from './ServiceManager';
import { ExecuteInWorkerProcess } from './IpcService';

@Service()
export class DisplayService extends ServiceBase {

  public init(): Promise<void> {
    return Promise.resolve(undefined);
  }

  @ExecuteInWorkerProcess()
  public async createOBSDisplay(name: string, electronWindowId: number, scaleFactor: number, sourceId: string): Promise<void> {
    const electronWindow = BrowserWindow.fromId(electronWindowId);
    return obs.createDisplay(name, electronWindow.getNativeWindowHandle(), scaleFactor, sourceId);
  }

  @ExecuteInWorkerProcess()
  public async moveOBSDisplay(name: string, x: number, y: number, width: number, height: number): Promise<void> {
    return obs.moveDisplay(name, x, y, width, height);
  }

  @ExecuteInWorkerProcess()
  public async destroyOBSDisplay(name: string): Promise<void> {
    return obs.destroyDisplay(name);
  }
}
