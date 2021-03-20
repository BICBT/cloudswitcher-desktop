import { Container, Service } from 'typedi';
import { IpcService } from './IpcService';
import { AudioService } from './AudioService';
import { BoserService } from './BoserService';
import { DialogService } from './DialogService';
import { DisplayService } from './DisplayService';
import { CGService } from './CGService';
import { MediaService } from './MediaService';
import { SourceService } from './SourceService';
import { ObsService } from './ObsService';

export type ServiceName =
  | 'AudioService'
  | 'BoserService'
  | 'CGService'
  | 'DialogService'
  | 'DisplayService'
  | 'IpcService'
  | 'MediaService'
  | 'SourceService'
  | 'ObsService';

export abstract class ServiceBase {
  public abstract init(): Promise<void>;
}

const services: Record<ServiceName, ServiceBase> = {
  'AudioService': Container.get(AudioService),
  'BoserService': Container.get(BoserService),
  'CGService': Container.get(CGService),
  'DialogService': Container.get(DialogService),
  'DisplayService': Container.get(DisplayService),
  'IpcService': Container.get(IpcService),
  'MediaService': Container.get(MediaService),
  'SourceService': Container.get(SourceService),
  'ObsService': Container.get(ObsService),
};

@Service()
export class ServiceManager {

  public async initAll(): Promise<void> {
    for (const service of Object.values(services)) {
      await service.init();
    }
  }

  public getService(name: ServiceName): ServiceBase | undefined {
    return services[name];
  }

  public getServiceName(service: ServiceBase): ServiceName | undefined {
    return (Object.keys(services) as ServiceName[]).find(key => services[key] === service);
  }
}
