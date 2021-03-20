import { Container, Service } from 'typedi';
import { Audio, UpdateAudioRequest } from '../common/types';
import { ExecuteInWorkerProcess, IpcEvent } from './IpcService';
import { SwitcherServerService } from './SwitcherServerService';
import { ObsService } from './ObsService';
import { ServiceBase } from './ServiceManager';
import { isWorkerWindow } from '../common/util';

@Service()
export class AudioService extends ServiceBase {
  private readonly switcherServerService = Container.get(SwitcherServerService);
  private readonly obsService = Container.get(ObsService);
  private audio?: Audio;

  public audioChanged: IpcEvent<Audio> = new IpcEvent<Audio>('audioChanged');

  @ExecuteInWorkerProcess()
  public async init(): Promise<void> {
    if (isWorkerWindow()) {
      this.audio = await this.switcherServerService.getAudio();
      this.obsService.updateAudio({
        audioWithVideo: this.audio.audioWithVideo,
      });
      this.audioChanged.emit(this.audio);
    }
  }

  @ExecuteInWorkerProcess()
  public async getAudio(): Promise<Audio | undefined> {
    return this.audio;
  }

  @ExecuteInWorkerProcess()
  public async updateAudio(request: UpdateAudioRequest): Promise<void> {
    this.audio = await this.switcherServerService.updateAudio(request);
    this.obsService.updateAudio(request);
    this.audioChanged.emit(this.audio);
  }
}
