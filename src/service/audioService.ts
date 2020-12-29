import { Service } from 'typedi';
import { ipcRenderer } from "electron";
import { SimpleEvent } from '../common/event';
import { Audio, UpdateAudioRequest } from '../common/types';

@Service()
export class AudioService {
  public audioChanged = new SimpleEvent<Audio>();

  public initialize(): void {
    ipcRenderer.on('audioChanged', (event, audio: Audio) => {
      this.audioChanged.emit(audio);
    });
  }

  public get audio(): Audio {
    return ipcRenderer.sendSync('getAudio');
  }

  public updateAudio(request: UpdateAudioRequest) {
    ipcRenderer.send('updateAudio', request);
  }
}
