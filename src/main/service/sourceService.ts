import { Container, Service } from 'typedi';
import * as uuid from 'uuid';
import { ObsService } from './obsService';
import { ObsHeadlessService } from './obsHeadlessService';
import { ipcMain } from 'electron';
import { StorageService } from './storageService';
import { broadcastMessage } from '../../common/util';
import { Source, Transition, TransitionType, UpdateSourceRequest } from '../../common/types';
import {SimpleEvent} from "../../common/event";

export interface ProgramChangedEvent {
  lastSource?: Source;
  currentSource: Source;
}

export interface PreviewChangedEvent {
  lastSource?: Source;
  currentSource: Source;
}

@Service()
export class SourceService {
  private readonly obsService: ObsService = Container.get(ObsService);
  private readonly obsHeadlessService: ObsHeadlessService = Container.get(ObsHeadlessService);
  private readonly storageService: StorageService = Container.get(StorageService);

  public sources: Record<number, Source> = {};
  public programChanged = new SimpleEvent<ProgramChangedEvent>();
  public previewChanged = new SimpleEvent<PreviewChangedEvent>();
  public previewSource?: Source;
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
    ipcMain.on('restart', (event, source: Source) => this.restart(source));
    ipcMain.on('updateSource', (event, source: Source, request: UpdateSourceRequest) => this.updateSource(source, request));

    ipcMain.on('getSources', event => event.returnValue = this.sources);
    ipcMain.on('getPreviewSource', event => event.returnValue = this.previewSource);
    ipcMain.on('getProgramTransition', event => event.returnValue = this.programTransition);
    ipcMain.on('getLiveSource', event => event.returnValue = this.liveSource);
  }

  public preview(source: Source) {
    const lastSource = this.previewSource;
    this.previewSource = source;
    broadcastMessage('previewChanged', source);
    this.previewChanged.emit({ lastSource, currentSource: this.previewSource });
  }

  public async take(source: Source, transitionType: TransitionType, transitionDurationMs: number) {
    const lastSource = this.programTransition?.source;
    this.programTransition = this.obsService.switchSource(lastSource, source, transitionType, transitionDurationMs);
    const currentSource = this.programTransition.source;
    await this.obsHeadlessService.switchSource(source, transitionType, transitionDurationMs);
    broadcastMessage('programChanged', this.programTransition);
    this.programChanged.emit({
      lastSource: lastSource,
      currentSource: currentSource,
    });
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
      this.obsService.updatePreviewUrl(this.liveSource);
    } else {
      this.liveSource = {
        id: 'output',
        index: -1,
        name: 'Output',
        url: url,
        previewUrl: url,
        sceneId: uuid.v4(),
        volume: 0,
        audioLock: false,
        audioMonitor: false,
      };
      this.obsService.createSource(this.liveSource);
    }
    broadcastMessage('liveChanged', this.liveSource);
    this.storageService.saveOutputUrl(url);
  }

  private async restart(source: Source) {
    this.obsService.restart(source);
    await this.obsHeadlessService.restart(source);
    broadcastMessage('sourceRestarted', source);
  }

  private async updateSource(source: Source, request: UpdateSourceRequest) {
    const existing = this.findSource(source.sceneId, source.id);
    if (existing) {
      await this.obsHeadlessService.updateSource(existing, request);
      this.obsService.updateSource(existing, request);
      Object.assign(existing, request);
      broadcastMessage('sourceChanged', existing);
    }
  }

  private findSource(sceneId: string, sourceId: string): Source | undefined {
    return Object.values(this.sources).find(s => s.sceneId === sceneId && s.id === sourceId);
  }
}
