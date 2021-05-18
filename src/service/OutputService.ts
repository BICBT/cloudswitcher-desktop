import { Container, Service } from 'typedi';
import { Output, UpdateOutputRequest } from '../common/types';
import { isMainProcess } from '../common/util';
import { SwitcherService } from './SwitcherService';
import { ExecuteInMainProcess, IpcEvent } from '../common/ipc';
import { ObsService } from './ObsService';

@Service()
export class OutputService {
  private readonly switcherService = Container.get(SwitcherService);
  private readonly obsService = Container.get(ObsService);
  private output?: Output;
  public outputChanged = new IpcEvent<Output>('outputChanged');

  public async initialize() {
    if (!isMainProcess()) {
      return;
    }
    await this.refreshOutput();
  }

  @ExecuteInMainProcess()
  public async getOutput(): Promise<Output | undefined> {
    return this.output;
  }

  @ExecuteInMainProcess()
  public async updateOutput(request: UpdateOutputRequest): Promise<void> {
    await this.switcherService.updateOutput(request);
    await this.refreshOutput();
  }

  @ExecuteInMainProcess()
  public async notifyPreviewChanged(): Promise<void> {
    if (this.output) {
      await this.obsService.restartSource(this.output.id);
      this.outputChanged.emit(this.output);
    }
  }

  private async refreshOutput(): Promise<void> {
    this.output = await this.switcherService.getOutput()
    await this.obsService.createSource(this.output.id, 'output', this.output.previewUrl);
    this.outputChanged.emit(this.output);
  }
}
