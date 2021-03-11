import { Service } from 'typedi';
import * as obs from 'obs-node';
import { BrowserWindow, ipcMain, webContents } from 'electron';
import { Source, Transition, TransitionType, UpdateAudioRequest, UpdateSourceRequest } from '../../common/types';
import { broadcastMessage } from '../../common/util';
import { Overlay } from 'obs-node';

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
  public initialize() {
    obs.startup({
      video: OBS_VIDEO_SETTINGS,
      audio: OBS_AUDIO_SETTINGS,
    });
    ipcMain.on('createOBSDisplay', (event, name: string, electronWindowId: number, scaleFactor: number, sourceId: string) =>
      event.returnValue = this.createOBSDisplay(name, electronWindowId, scaleFactor, sourceId));
    ipcMain.on('moveOBSDisplay', (event, name: string, x: number, y: number, width: number, height: number) =>
      event.returnValue = this.moveOBSDisplay(name, x, y, width, height));
    ipcMain.on('destroyOBSDisplay', (event, name: string) => event.returnValue = this.destroyOBSDisplay(name));
    ipcMain.on('screenshot', (event, source: Source) => this.screenshot(source));

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

  public createOBSDisplay(name: string, electronWindowId: number, scaleFactor: number, sourceId: string): void {
    const electronWindow = BrowserWindow.fromId(electronWindowId);
    obs.createDisplay(name, electronWindow.getNativeWindowHandle(), scaleFactor, sourceId);
  }

  public moveOBSDisplay(name: string, x: number, y: number, width: number, height: number): void {
    obs.moveDisplay(name, x, y, width, height);
  }

  public destroyOBSDisplay(name: string): void {
    obs.destroyDisplay(name);
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

  private async screenshot(source: Source) {
    const buffer = await obs.screenshot(source.sceneId, source.id);
    const base64 = buffer.toString('base64');
    broadcastMessage('screenshotted', source, base64);
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
