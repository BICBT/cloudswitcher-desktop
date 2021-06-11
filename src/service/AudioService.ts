import { Container, Service } from 'typedi';
import { AudioMode, Audio } from '../common/types';
import { ExecuteInMainProcess, IpcEvent } from '../common/ipc';
import { ObsService } from './ObsService';
import { isMainProcess, notNull } from '../common/util';
import { SwitcherService } from './SwitcherService';
import { OutputService } from "./OutputService";

@Service()
export class AudioService {
  private readonly switcherService = Container.get(SwitcherService);
  private readonly obsService = Container.get(ObsService);
  private readonly outputService = Container.get(OutputService);
  private audio?: Audio;
  public audioChanged: IpcEvent<Audio> = new IpcEvent<Audio>('audioChanged');

  public async initialize(): Promise<void> {
    if (!isMainProcess()) {
      return;
    }
    const audio = await this.switcherService.getAudio();
    this.audio = {
      volume: audio.volume,
      mode: audio.mode,
      monitor: false,
    };
    await this.obsService.updateAudioVolume(this.audio.volume);
    await this.obsService.updateAudioMode(this.audio.mode);
  }

  @ExecuteInMainProcess()
  public async getAudio(): Promise<Audio | undefined> {
    return this.audio;
  }

  @ExecuteInMainProcess()
  public async updateVolume(volume: number): Promise<void> {
    if (!this.audio) {
      throw new Error(`Audio can't be empty`);
    }
    await this.switcherService.updateAudio({ volume: volume });
    await this.obsService.updateAudioVolume(volume);
    this.audio.volume = volume;
    this.audioChanged.emit(this.audio);
  }

  @ExecuteInMainProcess()
  public async updateMode(mode: AudioMode): Promise<void> {
    if (!this.audio) {
      throw new Error(`Audio can't be empty`);
    }
    await this.switcherService.updateAudio({ mode: mode });
    await this.obsService.updateAudioMode(mode);
    this.audio.mode = mode;
    this.audioChanged.emit(this.audio);
  }

  @ExecuteInMainProcess()
  public async monitor(monitor: boolean): Promise<void> {
    if (!this.audio) {
      throw new Error(`Audio can't be empty`);
    }
    const output = notNull(await this.outputService.getOutput());
    await this.obsService.updateSourceMonitor(output.id, monitor);
    this.audio.monitor = monitor;
    this.audioChanged.emit(this.audio);
  }
}
