import { Container, Service } from 'typedi';
import { Source, Transition, TransitionType } from '../../types/obs';
import * as uuid from 'uuid';
import { ObsService } from './obsService';
import { ObsHeadlessService } from './obsHeadlessService';
import { ipcMain, webContents } from 'electron';
import { StorageService } from './storageService';

const DEFAULT_MUTED = true;

@Service()
export class SourceService {
  private readonly obsService: ObsService = Container.get(ObsService);
  private readonly obsHeadlessService: ObsHeadlessService = Container.get(ObsHeadlessService);
  private readonly storageService: StorageService = Container.get(StorageService);

  public sources: Record<number, Source> = {};
  private previewSource?: Source;
  private programTransition?: Transition;
  private liveSource?: Source;

  public async initialize() {
    // Initialize local obs
    this.obsService.initialize();
    const { sources, output } = await this.obsHeadlessService.initialize();
    this.sources = sources;

    // Create sources for local obs
    for (const source of Object.values(this.sources)) {
      this.obsService.createSource(source);
    }

    // Create output
    this.updateLiveUrl(output.previewUrl);

    ipcMain.on('preview', (event, source: Source) => this.preview(source));
    ipcMain.on('take', (event, source: Source, transitionType: TransitionType, transitionDurationMs: number) => this.take(source, transitionType, transitionDurationMs));
    ipcMain.on('updateLiveUrl', (event, url: string) => this.updateLiveUrl(url));
    ipcMain.on('muteSource', (event, source: Source, mute: boolean) => this.muteSource(source, mute));
    ipcMain.on('restart', (event, source: Source) => this.restart(source));

    ipcMain.on('getSources', event => event.returnValue = this.sources);
    ipcMain.on('getPreviewSource', event => event.returnValue = this.previewSource);
    ipcMain.on('getProgramTransition', event => event.returnValue = this.programTransition);
    ipcMain.on('getLiveSource', event => event.returnValue = this.liveSource);
  }

  public preview(source: Source) {
    this.previewSource = source;
    this.broadcastMessage('previewChanged', source);
  }

  public async take(source: Source, transitionType: TransitionType, transitionDurationMs: number) {
    const transition = await this.obsService.switchSource(this.programTransition?.source, source, transitionType, transitionDurationMs);
    await this.obsHeadlessService.switchSource(source, transitionType, transitionDurationMs);
    this.programTransition = transition;
    this.broadcastMessage('programChanged', this.programTransition);
  }

  public previewByIndex(index: number) {
    const source = this.sources[index];
    if (source) {
      this.preview(source);
    }
  }

  public async takeByIndex(index: number, transitionType: TransitionType = TransitionType.Cut, transitionDurationMs: number = 1000) {
    const source = this.sources[index];
    if (source) {
      await this.take(source, transitionType, transitionDurationMs);
    }
  }

  public updateLiveUrl(url: string) {
    if (url === this.liveSource?.url) {
      return;
    }
    if (this.liveSource) {
      this.liveSource.url = url;
      this.liveSource.previewUrl = url;
      this.obsService.updateSourceUrl(this.liveSource);
    } else {
      this.liveSource = {
        id: 'output',
        name: 'Output',
        url: url,
        previewUrl: url,
        muted: DEFAULT_MUTED,
        sceneId: uuid.v4(),
        channel: 63, // output channel
      };
      this.obsService.createSource(this.liveSource);
    }
    this.broadcastMessage('liveChanged', this.liveSource);
    this.storageService.saveOutputUrl(url);
  }

  private muteSource(source: Source, mute: boolean) {
    this.obsService.muteSource(source, mute);
    source.muted = mute;
    this.broadcastMessage('sourceMuteChanged', source);
  }

  private async restart(source: Source) {
    this.obsService.restart(source);
    await this.obsHeadlessService.restart(source);
    this.broadcastMessage('sourceRestarted', source);
  }

  private broadcastMessage(channel: string, ...args: any[]) {
    webContents.getAllWebContents().forEach(webContents => {
      webContents.send(channel, ...args);
    });
  }
}
