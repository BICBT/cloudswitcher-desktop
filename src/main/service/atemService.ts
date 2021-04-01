import { Container, Service } from 'typedi';
import { SourceService } from './sourceService';
import { TransitionType } from '../../common/types';

const Atem = require('atem'); // TODO: Add type declaration

@Service()
export class AtemService {
  private readonly atem: any;
  private readonly sourceService = Container.get(SourceService);

  constructor() {
    this.atem = new Atem();
  }

  public async initialize(deviceIp: string): Promise<void> {
    this.atem.on('connectionStateChange', (state: any) => {
      console.log(`Atem connectionStateChange ${state}`);
    });

    this.atem.on('previewBus', (name: string) => {
      const index = Number(name) - 1;
      const source = this.sourceService.sources[index];
      if (source) {
        this.sourceService.preview(source);
      }
    });

    this.atem.on('programBus', (name: string) => {
      const index = Number(name) - 1;
      const source = this.sourceService.sources[index];
      if (source) {
        this.sourceService.take(source, TransitionType.Cut, 0, true);
      }
    });

    this.atem.ip = deviceIp;
    this.atem.connect();
    console.log(`Connect atem device ${deviceIp}`);
  }
}
