import { Service } from 'typedi';
import { StudioClient } from '../../obs-headless/studio_grpc_pb';
import { Empty } from 'google-protobuf/google/protobuf/empty_pb';
import { SceneAddRequest, SceneAddResponse, SceneRemoveRequest, SceneSetAsCurrentRequest, SceneSetAsCurrentResponse, Show, ShowCreateRequest, ShowCreateResponse, SourceAddRequest, SourceAddResponse, StudioGetResponse } from '../../obs-headless/studio_pb';
import { OBS_SERVER_URL, OBS_SHOW_NAME } from '../../common/constant';
import { credentials } from 'grpc';
import { promisify } from 'util';
import { Source } from '../../types/obs';

@Service()
export class ObsHeadlessService {
  private readonly studioClient: StudioClient;
  private readonly studioStart: (request: Empty) => Promise<Empty>;
  private readonly studioGet: (request: Empty) => Promise<StudioGetResponse>;
  private readonly showCreate: (request: ShowCreateRequest) => Promise<ShowCreateResponse>;
  private readonly sceneAdd: (request: SceneAddRequest) => Promise<SceneAddResponse>;
  private readonly sourceAdd: (request: SourceAddRequest) => Promise<SourceAddResponse>;
  private readonly sceneRemove: (request: SceneRemoveRequest) => Promise<Empty>;
  private readonly sceneSetAsCurrent: (request: SceneSetAsCurrentRequest) => Promise<SceneSetAsCurrentResponse>;

  private show?: Show;

  constructor() {
    if (!OBS_SERVER_URL) {
      throw new Error(`OBS server url should not be empty.`);
    }
    this.studioClient = new StudioClient(OBS_SERVER_URL, credentials.createInsecure(), {
      'grpc.keepalive_time_ms': 120000,
      'grpc.http2.min_time_between_pings_ms': 120000,
      'grpc.keepalive_timeout_ms': 20000,
      'grpc.http2.max_pings_without_data': 0,
      'grpc.keepalive_permit_without_calls': 1,
    });
    this.studioStart = promisify(this.studioClient.studioStart).bind(this.studioClient) as (request: Empty) => Promise<Empty>;
    this.studioGet = promisify(this.studioClient.studioGet).bind(this.studioClient) as (request: Empty) => Promise<StudioGetResponse>;
    this.showCreate = promisify(this.studioClient.showCreate).bind(this.studioClient) as (request: ShowCreateRequest) => Promise<ShowCreateResponse>;
    this.sceneAdd = promisify(this.studioClient.sceneAdd).bind(this.studioClient) as (request: SceneAddRequest) => Promise<SceneAddResponse>;
    this.sourceAdd = promisify(this.studioClient.sourceAdd).bind(this.studioClient) as (request: SourceAddRequest) => Promise<SourceAddResponse>;
    this.sceneRemove = promisify(this.studioClient.sceneRemove).bind(this.studioClient) as (request: SceneRemoveRequest) => Promise<Empty>;
    this.sceneSetAsCurrent = promisify(this.studioClient.sceneSetAsCurrent).bind(this.studioClient) as (request: SceneSetAsCurrentRequest) => Promise<SceneSetAsCurrentResponse>;
  }

  public async initialize(): Promise<void> {
    const shows = (await this.studioGet(new Empty())).getStudio()?.getShowsList() || [];
    this.show = shows.find(s => s.getName() === OBS_SHOW_NAME);
    if (!this.show) {
      const request = new ShowCreateRequest();
      request.setShowName(OBS_SHOW_NAME);
      this.show = (await this.showCreate(request)).getShow() as Show;
    }

    // start show
    try {
      await this.studioStart(new Empty());
    } catch (error) {
      console.log(`Failed to start obs headless, maybe the show is already started.`);
    }
  }

  public async createSource(source: Source): Promise<void> {
    // Add scene
    if (!this.isSceneExisted(source.id)) {
      const sceneAddRequest = new SceneAddRequest();
      sceneAddRequest.setShowId(this.show?.getId() as string);
      sceneAddRequest.setSceneName(source.name);
      source.sceneId = (await this.sceneAdd(sceneAddRequest)).getScene()?.getId() as string;
    }

    // Add source
    if (!this.isSourceExisted(source.id)) {
      const sourceAddRequest = new SourceAddRequest();
      sourceAddRequest.setShowId(this.show?.getId() as string);
      sourceAddRequest.setSceneId(source.sceneId);
      sourceAddRequest.setSourceName(source.name);
      sourceAddRequest.setSourceType('RTMP');
      sourceAddRequest.setSourceUrl(source.url);
      source.id = this.getLocalSourceId(source.sceneId, (await this.sourceAdd(sourceAddRequest)).getSource()?.getId() as string);
    }
  };

  public async removeSource(source: Source): Promise<void> {
    const request = new SceneRemoveRequest();
    request.setShowId(this.show?.getId() as string);
    request.setSceneId(source.sceneId as string);
    await this.sceneRemove(request);
  }

  public async switchSource(source: Source, transitionType: string, transitionDurationMs: number) {
    const request = new SceneSetAsCurrentRequest();
    request.setShowId(this.show?.getId() as string);
    request.setSceneId(source.sceneId);
    request.setTransitionType(transitionType);
    request.setTransitionDurationMs(transitionDurationMs);
    await this.sceneSetAsCurrent(request);
  }

  private isSceneExisted(sceneId: string): boolean {
    return (this.show?.getScenesList() || []).some(scene => scene.getId() === sceneId);
  }

  private isSourceExisted(sourceId: string): boolean {
    return (this.show?.getScenesList() || []).some(scene =>
      (scene.getSourcesList() || []).some(source => this.getLocalSourceId(scene.getId(), source.getId()) === sourceId));
  }

  // noinspection JSMethodCanBeStatic
  private getLocalSourceId(serverSceneId: string, serverSourceId: string) {
    // Server source id maybe same for different scene, concat server scene id and server source id for local source id.
    return `${serverSceneId}_${serverSourceId}`;
  }
}
