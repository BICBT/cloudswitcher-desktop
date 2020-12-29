import { ipcMain } from "electron";
import { ObsService } from './obsService';
import { Container } from 'typedi';
import { ObsHeadlessService } from './obsHeadlessService';
import { Audio, UpdateAudioRequest } from '../../common/types';
import { broadcastMessage } from '../../common/util';

export class AudioService {
  private readonly obsHeadlessService: ObsHeadlessService = Container.get(ObsHeadlessService);
  private readonly obsService: ObsService = Container.get(ObsService);
  private audio?: Audio;

  public async initialized() {
    this.audio = await this.obsHeadlessService.getAudio();
    this.obsService.updateAudio({
      audioWithVideo: this.audio.audioWithVideo,
    });

    ipcMain.on('getAudio', event => event.returnValue = this.audio);
    ipcMain.on('updateAudio', (event, request: UpdateAudioRequest) => this.updateAudio(request));
  }

  private async updateAudio(request: UpdateAudioRequest) {
    if (this.audio) {
      await this.obsHeadlessService.updateAudio(request);
      this.obsService.updateAudio(request);
      Object.assign(this.audio, request);
      broadcastMessage('audioChanged', this.audio);
    }
  }
}
