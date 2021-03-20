import { Service } from 'typedi';
import axios from 'axios';
import { OBS_SERVER_URL } from '../common/constant';
import { replaceUrlParams } from '../common/util';
import { Audio, GetSourceResponse, Output, Source, TransitionType, UpdateAudioRequest, UpdateSourceRequest } from '../common/types';

const GET_SCENES_URL = `:switcherBaseUrl/v1/scenes`;
const GET_OUTPUT_URL = `:switcherBaseUrl/v1/output`;
const SWITCH_URL = `:switcherBaseUrl/v1/switch/:sceneId`;
const RESTART_SOURCE_URL = `:switcherBaseUrl/v1/restart`;
const GET_SOURCE_URL = `:switcherBaseUrl/v1/scenes/:sceneId/sources/:sourceId`;
const UPDATE_SOURCE_URL = `:switcherBaseUrl/v1/scenes/:sceneId/sources/:sourceId`;
const GET_AUDIO_URL = `:switcherBaseUrl/v1/audio`;
const UPDATE_AUDIO_URL = `:switcherBaseUrl/v1/audio`;

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

@Service()
export class SwitcherServerService  {

  constructor() {
    if (!OBS_SERVER_URL) {
      throw new Error(`OBS server url should not be empty.`);
    }
  }

  public async initialize(): Promise<{ sources: Record<number, Source>, output: Output }> {
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
    return { sources, output };
  }

  public async switchSource(source: Source, transitionType: TransitionType, transitionDurationMs: number) {
    try {
      await axios.post(replaceUrlParams(SWITCH_URL, { sceneId: source.sceneId }), {
        transitionType: transitionType,
        transitionMs: transitionDurationMs,
      });
    } catch (e) {
      console.log(`Failed to switch scene: ${e.message || e}`);
    }
  }

  public async restart(source: Source): Promise<void> {
    try {
      await axios.post(RESTART_SOURCE_URL, {
        sceneId: source.sceneId,
        sourceId: source.id,
      });
    } catch (e) {
      console.log(`Failed to restart source: ${e.message || e}`);
    }
  }

  public async getSource(sceneId: string, sourceId: string): Promise<GetSourceResponse> {
    return (await axios.get(replaceUrlParams(GET_SOURCE_URL, {
      sceneId: sceneId,
      sourceId: sourceId,
    }))).data as GetSourceResponse;
  }

  public async updateSource(source: Source, request: UpdateSourceRequest): Promise<void> {
    try {
      // Skip update audioMonitor
      request = { ...request, audioMonitor: undefined };
      if (Object.values(request).every(v => v === undefined)) {
        return;
      }
      await axios.patch(replaceUrlParams(UPDATE_SOURCE_URL, {
        sceneId: source.sceneId,
        sourceId: source.id
      }), request);
    } catch (e) {
      console.log(`Failed to update source: ${e.message || e}`);
    }
  }

  public async getAudio(): Promise<Audio> {
    return (await axios.get(GET_AUDIO_URL)).data as Audio;
  }

  public async updateAudio(request: UpdateAudioRequest): Promise<Audio> {
    return (await axios.patch(UPDATE_AUDIO_URL, request)).data as Audio;
  }
}
