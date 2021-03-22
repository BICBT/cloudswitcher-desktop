import { Container, Service } from 'typedi';
import { IpcService } from './IpcService';
import { AudioService } from './AudioService';
import { BoserService } from './BoserService';
import { DialogService } from './DialogService';
import { CGService } from './CGService';
import { MediaService } from './MediaService';
import { SourceService } from './SourceService';
import { ObsService } from './ObsService';
import { ServiceBase } from './ServiceBase';

@Service()
export class ServiceManager {
  private readonly services: ServiceBase[] = [
    Container.get(IpcService),
    Container.get(ObsService),
    Container.get(AudioService),
    Container.get(BoserService),
    Container.get(CGService),
    Container.get(DialogService),
    Container.get(MediaService),
    Container.get(SourceService),
  ];

  public async initializeAll(): Promise<void> {
    Container.get(IpcService).registerServices(this.services);
    for (const service of this.services) {
      await service.initialize();
    }
  }

  public getService(name: string): ServiceBase | undefined {
    return this.services.find(s => s.constructor.name === name);
  }
}
