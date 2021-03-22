import { Container, Service } from 'typedi';
import * as uuid from 'uuid';
import { ObsService } from './ObsService';
import { GetSourceResponse, Output, Source, Transition, TransitionType, UpdateSourceRequest } from '../common/types';
import { ExecuteInMainProcess, IpcEvent } from './IpcService';
import * as obs from 'obs-node';
import { ServiceBase } from './ServiceBase';
import { OBS_SERVER_URL } from '../common/constant';
import axios from 'axios';
import { isMainProcess, replaceUrlParams } from '../common/util';

interface SceneResponse {
  id: string;
  name: string;
  sources: SourceResponse[];
}

interface SourceResponse {
  id: string;
  name: string;
  url: string;
  previewUrl: string;
}

export interface ProgramChangedEvent {
  previous?: Transition;
  current: Transition;
}

export interface PreviewChangedEvent {
  previous?: Source;
  current: Source;
}

const GET_SCENES_URL = `${OBS_SERVER_URL}/v1/scenes`;
const GET_OUTPUT_URL = `${OBS_SERVER_URL}/v1/output`;
const SWITCH_URL = `${OBS_SERVER_URL}/v1/switch/:sceneId`;
const RESTART_SOURCE_URL = `${OBS_SERVER_URL}/v1/restart`;
const GET_SOURCE_URL = `${OBS_SERVER_URL}/v1/scenes/:sceneId/sources/:sourceId`;
const UPDATE_SOURCE_URL = `${OBS_SERVER_URL}/v1/scenes/:sceneId/sources/:sourceId`;

@Service()
export class SourceService extends ServiceBase {
  private readonly obsService: ObsService = Container.get(ObsService);
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

  public async initialize(): Promise<void> {
    if (isMainProcess()) {
      const [scenes, output] = await Promise.all([
        axios.get(GET_SCENES_URL).then(res => res.data as SceneResponse[]),
        axios.get(GET_OUTPUT_URL).then(res => res.data as Output),
      ]);
      const sources: Record<number, Source> = {};
      let index = 0;
      for (let scene of scenes) {
        for (let source of scene.sources) {
          const r: GetSourceResponse = await this.getSource(scene.id, source.id);
          sources[index] = {
            id: source.id,
            index: index,
            name: source.name,
            url: source.url,
            previewUrl: source.previewUrl,
            sceneId: scene.id,
            volume: r.volume,
            audioLock: r.audioLock,
            audioMonitor: r.audioMonitor,
          };
          index++;
        }
      }
      this.sources = sources;
      // Create sources for local obs
      for (const source of Object.values(this.sources)) {
        await this.obsService.createSource(source);
      }
      // Create output
      await this.updateLiveUrl(output.previewUrl);
    }
  }

  @ExecuteInMainProcess()
  public async getSources(): Promise<Record<number, Source>> {
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
  public async getLiveSource(): Promise<Source | undefined> {
    return this.liveSource;
  }

  @ExecuteInMainProcess()
  public async preview(source: Source): Promise<void> {
    const previous = this.previewSource;
    this.previewSource = source;
    this.previewChanged.emit({ previous: previous, current: this.previewSource });
  }

  @ExecuteInMainProcess()
  public async take(source: Source, transitionType: TransitionType = TransitionType.Cut, transitionDurationMs: number = 3000) {
    const previous = this.programTransition;
    this.programTransition = await this.obsService.switchSource(previous?.source, source, transitionType, transitionDurationMs);
    const current = this.programTransition;
    await axios.post(replaceUrlParams(SWITCH_URL, { sceneId: source.sceneId }), {
      transitionType: transitionType,
      transitionMs: transitionDurationMs,
    });
    this.programChanged.emit({
      previous: previous,
      current: current,
    });
  }

  @ExecuteInMainProcess()
  public async previewByIndex(index: number): Promise<void> {
    const source = this.sources[index];
    if (source) {
      await this.preview(source);
    }
  }

  @ExecuteInMainProcess()
  public async takeByIndex(index: number, transitionType: TransitionType = TransitionType.Cut, transitionDurationMs: number = 1000) {
    const source = this.sources[index];
    if (source) {
      await this.take(source, transitionType, transitionDurationMs);
    }
  }

  @ExecuteInMainProcess()
  public async updateLiveUrl(url: string): Promise<void> {
    if (url === this.liveSource?.url) {
      return;
    }
    if (this.liveSource) {
      this.liveSource.url = url;
      this.liveSource.previewUrl = url;
      await this.obsService.updatePreviewUrl(this.liveSource);
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
      await this.obsService.createSource(this.liveSource);
    }
    this.liveChanged.emit(this.liveSource);
  }

  @ExecuteInMainProcess()
  public async restart(source: Source) {
    await axios.post(RESTART_SOURCE_URL, {
      sceneId: source.sceneId,
      sourceId: source.id,
    });
    await this.obsService.restart(source);
    this.sourceRestarted.emit(source);
  }

  @ExecuteInMainProcess()
  public async getSource(sceneId: string, sourceId: string): Promise<GetSourceResponse> {
    return (await axios.get(replaceUrlParams(GET_SOURCE_URL, {
      sceneId: sceneId,
      sourceId: sourceId,
    }))).data as GetSourceResponse;
  }

  @ExecuteInMainProcess()
  public async updateSource(source: Source, request: UpdateSourceRequest) {
    const existing = this.findSource(source.sceneId, source.id);
    if (existing) {
      if (request.volume !== undefined || request.audioMonitor !== undefined) {
        await axios.patch(replaceUrlParams(UPDATE_SOURCE_URL, {
          sceneId: source.sceneId,
          sourceId: source.id
        }), {
          volume: request.volume,
          audioMonitor: request.audioMonitor,
        });
      }
      await this.obsService.updateSource(existing, request);
      Object.assign(existing, request);
      this.sourceChanged.emit(existing);
    }
  }

  @ExecuteInMainProcess()
  public async screenshot(source: Source): Promise<string> {
    const buffer = await obs.screenshot(source.sceneId, source.id);
    return buffer.toString('base64');
  }

  private findSource(sceneId: string, sourceId: string): Source | undefined {
    return Object.values(this.sources).find(s => s.sceneId === sceneId && s.id === sourceId);
  }
}
