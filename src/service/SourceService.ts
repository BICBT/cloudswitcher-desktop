import { Container, Service } from 'typedi';
import { ObsService } from './ObsService';
import { AddSourceRequest, Source, SourceResponse, Transition, TransitionType, UpdateSourceRequest } from '../common/types';
import { ExecuteInMainProcess, IpcEvent } from './IpcService';
import * as obs from 'obs-node';
import { isMainProcess, notNull } from '../common/util';
import { SwitcherService } from './SwitcherService';

export interface ProgramChangedEvent {
  previous?: Transition;
  current: Transition;
}

export interface PreviewChangedEvent {
  previous?: Source;
  current: Source;
}

function getSource(response: SourceResponse): Source {
  return {
    ...response,
    monitor: false,
  };
}

@Service()
export class SourceService {
  private readonly switcherService = Container.get(SwitcherService);
  private readonly obsService = Container.get(ObsService);
  private sources: Source[] = [];
  private previewSource?: Source;
  private programTransition?: Transition;

  public sourcesChanged = new IpcEvent<Source[]>('sourcesChanged');
  public programChanged = new IpcEvent<ProgramChangedEvent>('programChanged');
  public previewChanged = new IpcEvent<PreviewChangedEvent>('previewChanged');
  public sourceChanged = new IpcEvent<Source>('sourceChanged');

  public async initialize(): Promise<void> {
    if (!isMainProcess()) {
      return;
    }
    this.sources = (await this.switcherService.getSources()).map(getSource);
    for (const source of this.sources) {
      await this.obsService.createSource(source.id, source.name, source.previewUrl);
      await this.obsService.updateSourceVolume(source.id, source.volume);
      await this.obsService.updateSourceAudioLock(source.id, source.audioLock);
    }
  }

  @ExecuteInMainProcess()
  public async getSources(): Promise<Source[]> {
    return this.sources;
  }

  @ExecuteInMainProcess()
  public async getPreviewSource(): Promise<Source | undefined> {
    return this.previewSource;
  }

  @ExecuteInMainProcess()
  public async getProgramTransition(): Promise<Transition | undefined> {
    return this.programTransition;
  }

  @ExecuteInMainProcess()
  public async preview(source: Source): Promise<void> {
    const previous = this.previewSource;
    this.previewSource = source;
    this.previewChanged.emit({ previous: previous, current: this.previewSource });
  }

  @ExecuteInMainProcess()
  public async previewByIndex(index: number): Promise<void> {
    const source = this.sources.find(s => s.index === index);
    if (source) {
      await this.preview(source);
    }
  }

  @ExecuteInMainProcess()
  public async take(source: Source, transitionType: TransitionType = TransitionType.Cut, transitionMs: number = 2000): Promise<void> {
    const previous = this.programTransition;
    await this.switcherService.switch(source, transitionType, transitionMs);
    const current = await this.obsService.switchSource(previous?.source, source, transitionType, transitionMs);
    this.programTransition = current;
    this.programChanged.emit({
      previous: previous,
      current: current,
    });
  }

  @ExecuteInMainProcess()
  public async takeByIndex(index: number): Promise<void> {
    const source = this.sources.find(s => s.index === index);
    if (source) {
      await this.take(source);
    }
  }

  @ExecuteInMainProcess()
  public async addSource(request: AddSourceRequest): Promise<void> {
    const source = getSource(await this.switcherService.addSource(request));
    await this.obsService.createSource(source.id, source.name, source.previewUrl);
    this.sources.push(source);
    this.sourcesChanged.emit(this.sources);
  }

  @ExecuteInMainProcess()
  public async updateSource(sourceId: string, request: UpdateSourceRequest): Promise<void> {
    const index = this.sources.findIndex(s => s.id === sourceId);
    if (index === -1) {
      throw new Error(`Can't find source: ${sourceId}`);
    }
    const lastSource = this.sources[index];
    const source = getSource(await this.switcherService.updateSource(lastSource, request));
    this.sources[index] = source;
    await this.obsService.updateSource(source.id, source.name, source.previewUrl);
    this.sourcesChanged.emit(this.sources);
    this.sourceChanged.emit(source);
  }

  @ExecuteInMainProcess()
  public async deleteSource(sourceId: string): Promise<void> {
    const index = this.sources.findIndex(s => s.id === sourceId);
    if (index === -1) {
      throw new Error(`Can't find source: ${sourceId}`);
    }
    await this.switcherService.deleteSource(sourceId);
    await this.obsService.deleteSource(sourceId);
    this.sources.splice(index, 1);
    this.sourcesChanged.emit(this.sources);
  }

  @ExecuteInMainProcess()
  public async updateVolume(source: Source, volume: number): Promise<void> {
    const existing = notNull(this.findSource(source.id));
    await this.switcherService.updateSource(source, { volume });
    await this.obsService.updateSourceVolume(existing.id, volume);
    existing.volume = volume;
    this.sourceChanged.emit(existing);
  }

  @ExecuteInMainProcess()
  public async updateAudioLock(source: Source, audioLock: boolean): Promise<void> {
    const existing = notNull(this.findSource(source.id));
    await this.switcherService.updateSource(source, { audioLock: audioLock });
    await this.obsService.updateSourceAudioLock(existing.id, audioLock);
    existing.audioLock = audioLock;
    this.sourceChanged.emit(existing);
  }

  @ExecuteInMainProcess()
  public async updateMonitor(source: Source, monitor: boolean): Promise<void> {
    const existing = notNull(this.findSource(source.id));
    await this.obsService.updateSourceMonitor(existing.id, monitor);
    existing.monitor = monitor;
    this.sourceChanged.emit(existing);
  }

  @ExecuteInMainProcess()
  public async screenshot(source: Source): Promise<string> {
    const buffer = await obs.screenshot(source.id, source.id);
    return buffer.toString('base64');
  }

  private findSource(sourceId: string): Source | undefined {
    return this.sources.find(s => s.id === sourceId);
  }
}
