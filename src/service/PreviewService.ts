import { Container, Service } from 'typedi';
import { Preview, UpdatePreviewRequest } from '../common/types';
import { SwitcherService } from './SwitcherService';
import { ExecuteInMainProcess } from '../common/ipc';
import { SourceService } from './SourceService';

@Service()
export class PreviewService {
  private readonly switcherService = Container.get(SwitcherService);
  private readonly sourceService = Container.get(SourceService);

  @ExecuteInMainProcess()
  public async getPreview(): Promise<Preview> {
    return await this.switcherService.getPreview();
  }

  @ExecuteInMainProcess()
  public async updatePreview(request: UpdatePreviewRequest): Promise<void> {
    await this.switcherService.updatePreview(request);
    await this.sourceService.notifyPreviewChanged();
  }
}
