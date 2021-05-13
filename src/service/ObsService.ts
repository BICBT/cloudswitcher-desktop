import * as path from 'path';
import { Service } from 'typedi';
import { BrowserWindow, webContents } from 'electron';
import isDev from 'electron-is-dev';
import * as obs from 'obs-node';
import { Overlay } from 'obs-node';
import { AudioMode, Source, Transition, TransitionType } from '../common/types';
import { ExecuteInMainProcess } from '../common/ipc';
import { isLocal, isMainProcess } from '../common/util';

const OBS_VIDEO_SETTINGS: obs.VideoSettings = {
  baseWidth: 640,
  baseHeight: 360,
  outputWidth: 640,
  outputHeight: 360,
  fpsNum: 25,
  fpsDen: 1,
};

const OBS_AUDIO_SETTINGS: obs.AudioSettings = {
  sampleRate: 44100,
};

@Service()
export class ObsService {

  public async initialize(): Promise<void> {
    if (!isMainProcess()) {
      return;
    }
    if (isDev || isLocal()) {
      obs.setFontPath(path.resolve(process.cwd(), 'src/fonts'));
    } else {
      obs.setFontPath(path.resolve(process.resourcesPath, 'fonts'));
    }
    obs.startup({
      video: OBS_VIDEO_SETTINGS,
      audio: OBS_AUDIO_SETTINGS,
    });
    obs.addVolmeterCallback((sceneId: string, sourceId: string, channels: number, magnitude: number[], peak: number[], input_peak: number[]) => {
      webContents.getAllWebContents().forEach(webContents => {
        webContents.send('volmeterChanged', sourceId, channels, magnitude, peak, input_peak);
      });
    });
  }

  @ExecuteInMainProcess()
  public async createSource(id: string, name: string, url: string): Promise<void> {
    obs.addScene(id);
    obs.addSource(id, id, {
      name: name,
      type: 'live',
      url: url,
      hardwareDecoder: true,
      bufferingMb: 0,
    });
  }

  @ExecuteInMainProcess()
  public async switchSource(from: Source | undefined, to: Source, transitionType: TransitionType, transitionDurationMs: number): Promise<Transition> {
    obs.switchToScene(to.id, transitionType, transitionDurationMs);
    return {
      id: transitionType,
      type: transitionType,
      source: to,
    };
  }

  @ExecuteInMainProcess()
  public async createOBSDisplay(name: string, electronWindowId: number, scaleFactor: number, sourceId: string): Promise<void> {
    const electronWindow = BrowserWindow.fromId(electronWindowId);
    return obs.createDisplay(name, electronWindow.getNativeWindowHandle(), scaleFactor, sourceId);
  }

  @ExecuteInMainProcess()
  public async moveOBSDisplay(name: string, x: number, y: number, width: number, height: number): Promise<void> {
    return obs.moveDisplay(name, x, y, width, height);
  }

  @ExecuteInMainProcess()
  public async destroyOBSDisplay(name: string): Promise<void> {
    return obs.destroyDisplay(name);
  }

  @ExecuteInMainProcess()
  public async updateAudioVolume(volume: number): Promise<void> {
    obs.updateAudio({ volume });
  }

  @ExecuteInMainProcess()
  public async updateAudioMode(mode: AudioMode): Promise<void> {
    obs.updateAudio({ mode });
  }

  @ExecuteInMainProcess()
  public async updateSource(id: string, name: string, url: string): Promise<void> {
    obs.updateSource(id, id, {
      name: name,
      url: url,
    });
  }

  @ExecuteInMainProcess()
  public async restartSource(sourceId: string): Promise<void> {
    obs.restartSource(sourceId, sourceId);
  }

  @ExecuteInMainProcess()
  public async deleteSource(sourceId: string) {
    obs.removeScene(sourceId);
  }

  @ExecuteInMainProcess()
  public async updateSourceVolume(sourceId: string, volume: number) {
    obs.updateSource(sourceId, sourceId, { volume });
  }

  @ExecuteInMainProcess()
  public async updateSourceMonitor(sourceId: string, monitor: boolean) {
    obs.updateSource(sourceId, sourceId, { monitor });
  }

  @ExecuteInMainProcess()
  public async updateSourceAudioLock(sourceId: string, audioLock: boolean) {
    obs.updateSource(sourceId, sourceId, { audioLock });
  }

  @ExecuteInMainProcess()
  public async close() {
    obs.shutdown();
  }

  @ExecuteInMainProcess()
  public async addOverlay(overlay: Overlay): Promise<void> {
    obs.addOverlay(overlay);
  }

  @ExecuteInMainProcess()
  public async updateOverlay(overlay: Overlay): Promise<void> {
    obs.removeOverlay(overlay.id);
    obs.addOverlay(overlay);
    overlay.status = 'down';
  }

  @ExecuteInMainProcess()
  public async removeOverlay(overlayId: string): Promise<void> {
    obs.removeOverlay(overlayId);
  }

  @ExecuteInMainProcess()
  public async upOverlay(overlayId: string): Promise<void> {
    obs.upOverlay(overlayId);
  }

  @ExecuteInMainProcess()
  public async downOverlay(overlayId: string): Promise<void> {
    obs.downOverlay(overlayId);
  }
}
