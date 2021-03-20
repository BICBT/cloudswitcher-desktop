import { Container, Service } from 'typedi';
import * as uuid from 'uuid';
import { ObsService } from './ObsService';
import { SwitcherServerService } from './SwitcherServerService';
import { isWorkerWindow } from '../common/util';
import { Source, Transition, TransitionType, UpdateSourceRequest } from '../common/types';
import { ExecuteInWorkerProcess, IpcEvent } from './IpcService';
import { ServiceBase } from './ServiceManager';
import * as obs from 'obs-node';

export interface ProgramChangedEvent {
  previous?: Transition;
  current: Transition;
}

export interface PreviewChangedEvent {
  previous?: Source;
  current: Source;
}

@Service()
export class SourceService extends ServiceBase {
  private readonly obsService: ObsService = Container.get(ObsService);
  private readonly switcherServerService: SwitcherServerService = Container.get(SwitcherServerService);
  private sources: Record<number, Source> = {};
  private previewSource?: Source;
  private programTransition?: Transition;
  private liveSource?: Source;

  public sourcesChanged = new IpcEvent<Source[]>('sourcesChanged');
  public programChanged = new IpcEvent<ProgramChangedEvent>('programChanged');
  public previewChanged = new IpcEvent<PreviewChangedEvent>('previewChanged');
  public liveChanged = new IpcEvent<Source>('liveChanged');
  public sourceRestarted = new IpcEvent<Source>('sourceRestarted');
  public sourceChanged = new IpcEvent<Source>('sourceChanged');

  @ExecuteInWorkerProcess()
  public async init(): Promise<void> {
    if (isWorkerWindow()) {
      const { sources, output } = await this.switcherServerService.initialize();
      this.sources = sources;
      // Create sources for local obs
      for (const source of Object.values(this.sources)) {
        this.obsService.createSource(source);
      }
      // Create output
      this.updateLiveUrl(output.previewUrl);
    }
  }

  @ExecuteInWorkerProcess()
  public async getSources(): Promise<Record<number, Source>> {
    return this.sources;
  }

  @ExecuteInWorkerProcess()
  public async getPreviewSource(): Promise<Source | undefined> {
    return this.previewSource;
  }

  @ExecuteInWorkerProcess()
  public async getProgramTransition(): Promise<Transition | undefined> {
    return this.programTransition;
  }

  @ExecuteInWorkerProcess()
  public async getLiveSource(): Promise<Source | undefined> {
    return this.liveSource;
  }

  @ExecuteInWorkerProcess()
  public preview(source: Source) {
    const previous = this.previewSource;
    this.previewSource = source;
    this.previewChanged.emit({ previous: previous, current: this.previewSource });
  }

  @ExecuteInWorkerProcess()
  public async take(source: Source, transitionType: TransitionType = TransitionType.Cut, transitionDurationMs: number = 3000) {
    const previous = this.programTransition;
    this.programTransition = this.obsService.switchSource(previous?.source, source, transitionType, transitionDurationMs);
    const current = this.programTransition;
    await this.switcherServerService.switchSource(source, transitionType, transitionDurationMs);
    this.programChanged.emit({
      previous: previous,
      current: current,
    });
  }

  @ExecuteInWorkerProcess()
  public previewByIndex(index: number) {
    const source = this.sources[index];
    if (source) {
      this.preview(source);
    }
  }

  @ExecuteInWorkerProcess()
  public async takeByIndex(index: number, transitionType: TransitionType = TransitionType.Cut, transitionDurationMs: number = 1000) {
    const source = this.sources[index];
    if (source) {
      await this.take(source, transitionType, transitionDurationMs);
    }
  }

  @ExecuteInWorkerProcess()
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
        id: 'live output',
        index: -1,
        name: 'Live Output',
        url: url,
        previewUrl: url,
        sceneId: uuid.v4(),
        volume: 0,
        audioLock: false,
        audioMonitor: false,
      };
      this.obsService.createSource(this.liveSource);
    }
    this.liveChanged.emit(this.liveSource);
  }

  @ExecuteInWorkerProcess()
  public async restart(source: Source) {
    this.obsService.restart(source);
    await this.switcherServerService.restart(source);
    this.sourceRestarted.emit(source);
  }

  @ExecuteInWorkerProcess()
  public async updateSource(source: Source, request: UpdateSourceRequest) {
    const existing = this.findSource(source.sceneId, source.id);
    if (existing) {
      await this.switcherServerService.updateSource(existing, request);
      this.obsService.updateSource(existing, request);
      Object.assign(existing, request);
      this.sourceChanged.emit(existing);
    }
  }

  @ExecuteInWorkerProcess()
  public async screenshot(source: Source): Promise<string> {
    const buffer = await obs.screenshot(source.sceneId, source.id);
    return buffer.toString('base64');
  }

  private findSource(sceneId: string, sourceId: string): Source | undefined {
    return Object.values(this.sources).find(s => s.sceneId === sceneId && s.id === sourceId);
  }
}
