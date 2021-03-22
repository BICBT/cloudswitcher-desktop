import * as path from 'path';
import { Service } from 'typedi';
import { BrowserWindow, webContents } from 'electron';
import * as isDev from 'electron-is-dev';
import * as obs from 'obs-node';
import { Overlay } from 'obs-node';
import { Source, Transition, TransitionType, UpdateAudioRequest, UpdateSourceRequest } from '../common/types';
import { ServiceBase } from './ServiceBase';
import { ExecuteInMainProcess } from './IpcService';
import { isMainProcess } from '../common/util';

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
export class ObsService extends ServiceBase {

  public async initialize(): Promise<void> {
    if (isMainProcess()) {
      if (isDev) {
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
          webContents.send('volmeterChanged', sceneId, sourceId, channels, magnitude, peak, input_peak);
        });
      });
    }
  }

  @ExecuteInMainProcess()
  public async createSource(source: Source): Promise<void> {
    obs.addScene(source.sceneId);
    obs.addSource(source.sceneId, source.id, {
      isFile: false,
      type: 'MediaSource',
      url: source.previewUrl,
      hardwareDecoder: true,
      startOnActive: false,
      bufferSize: 0,
      enableBuffer: true,
    });
  }

  @ExecuteInMainProcess()
  public async updatePreviewUrl(source: Source): Promise<void> {
    obs.updateSource(source.sceneId, source.id, {
      url: source.previewUrl,
    });
  }

  @ExecuteInMainProcess()
  public async switchSource(from: Source | undefined, to: Source, transitionType: TransitionType, transitionDurationMs: number): Promise<Transition> {
    obs.switchToScene(to.sceneId, transitionType, transitionDurationMs);
    return {
      id: transitionType,
      type: transitionType,
      source: to,
    };
  }

  @ExecuteInMainProcess()
  public async restart(source: Source): Promise<void> {
    obs.restartSource(source.sceneId, source.id);
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
  public async updateAudio(request: UpdateAudioRequest): Promise<void> {
    obs.updateAudio({
      masterVolume: request.masterVolume,
      audioWithVideo: request.audioWithVideo,
      pgmMonitor: request.pgmMonitor,
    });
  }

  @ExecuteInMainProcess()
  public async updateSource(source: Source, request: UpdateSourceRequest): Promise<void> {
    obs.updateSource(source.sceneId, source.id, request);
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
