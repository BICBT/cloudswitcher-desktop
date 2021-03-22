import { Container, Service } from 'typedi';
import { Audio, UpdateAudioRequest } from '../common/types';
import { ExecuteInMainProcess, IpcEvent } from './IpcService';
import { ObsService } from './ObsService';
import { ServiceBase } from './ServiceBase';
import { OBS_SERVER_URL } from '../common/constant';
import axios from 'axios';
import { isMainProcess } from '../common/util';

const GET_AUDIO_URL = `${OBS_SERVER_URL}/v1/audio`;
const UPDATE_AUDIO_URL = `${OBS_SERVER_URL}/v1/audio`;

@Service()
export class AudioService extends ServiceBase {
  private readonly obsService = Container.get(ObsService);
  private audio?: Audio;
  public audioChanged: IpcEvent<Audio> = new IpcEvent<Audio>('audioChanged');

  public async initialize(): Promise<void> {
    if (isMainProcess()) {
      this.audio = (await axios.get(GET_AUDIO_URL)).data as Audio;
      await this.obsService.updateAudio({
        masterVolume: this.audio.masterVolume,
        audioWithVideo: this.audio.audioWithVideo,
      });
    }
  }

  @ExecuteInMainProcess()
  public async getAudio(): Promise<Audio | undefined> {
    return this.audio;
  }

  @ExecuteInMainProcess()
  public async updateAudio(request: UpdateAudioRequest): Promise<void> {
    if (!this.audio) {
      throw new Error(`Audio is empty`);
    }
    await axios.patch(UPDATE_AUDIO_URL, request);
    Object.assign(this.audio, request);
    await this.obsService.updateAudio(request);
    this.audioChanged.emit(this.audio);
  }
}
