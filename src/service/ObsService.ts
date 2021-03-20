import * as path from 'path';
import { Service } from 'typedi';
import { ipcMain, webContents } from 'electron';
import * as isDev from 'electron-is-dev';
import * as obs from 'obs-node';
import { Source, Transition, TransitionType, UpdateAudioRequest, UpdateSourceRequest } from '../common/types';
import { broadcastMessage } from '../common/util';
import { Overlay } from 'obs-node';
import { ServiceBase } from './ServiceManager';

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

  public async init(): Promise<void> {
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

  public createSource(source: Source): void {
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

  public updatePreviewUrl(source: Source): void {
    obs.updateSource(source.sceneId, source.id, {
      url: source.previewUrl,
    });
  }

  public switchSource(from: Source | undefined, to: Source, transitionType: TransitionType, transitionDurationMs: number): Transition {
    obs.switchToScene(to.sceneId, transitionType, transitionDurationMs);
    return {
      id: transitionType,
      type: transitionType,
      source: to,
    };
  }

  public restart(source: Source): void {
    obs.restartSource(source.sceneId, source.id);
  }

  public updateAudio(request: UpdateAudioRequest) {
    obs.updateAudio({
      masterVolume: request.masterVolume,
      audioWithVideo: request.audioWithVideo,
      pgmMonitor: request.pgmMonitor,
    });
  }

  public updateSource(source: Source, request: UpdateSourceRequest): void {
    obs.updateSource(source.sceneId, source.id, request);
  }

  public close() {
    obs.shutdown();
  }

  public addOverlay(overlay: Overlay) {
    obs.addOverlay(overlay);
  }

  public updateOverlay(overlay: Overlay) {
    obs.removeOverlay(overlay.id);
    obs.addOverlay(overlay);
    overlay.status = 'down';
  }

  public removeOverlay(overlayId: string) {
    obs.removeOverlay(overlayId);
  }

  public upOverlay(overlayId: string) {
    obs.upOverlay(overlayId);
  }

  public downOverlay(overlayId: string) {
    obs.downOverlay(overlayId);
  }
}
