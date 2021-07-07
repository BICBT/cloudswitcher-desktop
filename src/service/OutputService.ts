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
    this.output = await this.switcherService.getOutput();
    await this.obsService.createSource(this.output.id, 'output', this.output.previewUrl);
  }

  @ExecuteInMainProcess()
  public async getOutput(): Promise<Output | undefined> {
    return this.output;
  }

  @ExecuteInMainProcess()
  public async updateOutput(request: UpdateOutputRequest): Promise<void> {
    await this.switcherService.updateOutput(request);
    this.output = await this.switcherService.getOutput();
    await this.obsService.updateSource(this.output.id, 'output', this.output.previewUrl);
    await this.notifyPreviewChanged();
  }

  @ExecuteInMainProcess()
  public async notifyPreviewChanged(): Promise<void> {
    if (this.output) {
      const newOutput = await this.switcherService.getOutput();
      if (this.output.previewUrl !== newOutput.previewUrl) {
        this.output.previewUrl = newOutput.previewUrl;
        await this.obsService.updateSource(this.output.id, 'output', this.output.previewUrl);
      } else {
        await this.obsService.restartSource(this.output.id);
      }
      this.outputChanged.emit(this.output);
    }
  }
}
