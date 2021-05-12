import axios from 'axios';
import { Service } from 'typedi';
import { AddSourceRequest, AudioResponse, CG, Output, Overlay, OverlayRequestWrapper, Preview, Source, SourceResponse, StreamType, Switcher, TransitionType, UpdateAudioRequest, UpdateOutputRequest, UpdatePreviewRequest, UpdateSourceRequest } from '../common/types';
import { ExecuteInMainProcess } from '../common/ipc';
import { as, removeKey, replaceUrlParams } from '../common/util';
import { SWITCHER_BASE_URL } from '../common/constant';

const GENERATE_URL_URL = `${SWITCHER_BASE_URL}/v1/switchers/:switcherId/generateUrl`;

const GET_SOURCES_URL = `:baseUrl/v1/sources`;
const ADD_SOURCE_URL = `:baseUrl/v1/sources`;
const UPDATE_SOURCE_URL = `:baseUrl/v1/sources/:sourceId`;
const DELETE_SOURCE_URL = `:baseUrl/v1/sources/:sourceId`;
const SWITCH_URL = `:baseUrl/v1/switch/:sourceId`;
const GET_OUTPUT_URL = `:baseUrl/v1/output`;
const UPDATE_OUTPUT_URL = `:baseUrl/v1/output`;
const GET_PREVIEW_URL = `:baseUrl/v1/preview`;
const UPDATE_PREVIEW_URL = `:baseUrl/v1/preview`;
const GET_AUDIO_URL = `:baseUrl/v1/audio`;
const UPDATE_AUDIO_URL = `:baseUrl/v1/audio`;
const GET_OVERLAYS_URL = `:baseUrl/v1/overlays`;
const ADD_OVERLAY_URL = `:baseUrl/v1/overlays`;
const UPDATE_OVERLAY_URL = `:baseUrl/v1/overlays/:overlayId`;
const REMOVE_OVERLAY_URL = `:baseUrl/v1/overlays/:overlayId`;
const UP_OVERLAY_URL = `:baseUrl/v1/overlays/:overlayId/up`;
const DOWN_OVERLAY_URL = `:baseUrl/v1/overlays/:overlayId/down`;

@Service()
export class SwitcherService {
  private switcher?: Switcher;

  @ExecuteInMainProcess()
  public async generateUrl(type: StreamType, index: number): Promise<{ url: string }> {
    return (await axios.get(replaceUrlParams(GENERATE_URL_URL, { switcherId: this.switcher?.id }), { params: { type, index } })).data;
  }

  @ExecuteInMainProcess()
  public async setSwitcher(switcher: Switcher): Promise<void> {
    this.switcher = switcher;
  }

  @ExecuteInMainProcess()
  public async getSwitcher(): Promise<Switcher | undefined> {
    return this.switcher;
  }

  @ExecuteInMainProcess()
  public async getSources(): Promise<SourceResponse[]> {
    return (await axios.get(replaceUrlParams(GET_SOURCES_URL, { baseUrl: this.switcher?.baseUrl }))).data as SourceResponse[];
  }

  @ExecuteInMainProcess()
  public async addSource(request: AddSourceRequest): Promise<SourceResponse> {
    return (await axios.post(replaceUrlParams(ADD_SOURCE_URL, { baseUrl: this.switcher?.baseUrl }), request)).data;
  }

  @ExecuteInMainProcess()
  public async updateSource(source: Source, request: UpdateSourceRequest): Promise<SourceResponse> {
    return (await axios.patch(replaceUrlParams(UPDATE_SOURCE_URL, { baseUrl: this.switcher?.baseUrl, sourceId: source.id }), request)).data;
  }

  @ExecuteInMainProcess()
  public async deleteSource(sourceId: string): Promise<void> {
    await axios.delete(replaceUrlParams(DELETE_SOURCE_URL, { baseUrl: this.switcher?.baseUrl, sourceId: sourceId }));
  }

  @ExecuteInMainProcess()
  public async switch(source: Source, transitionType: TransitionType, transitionMs: number) {
    await axios.post(replaceUrlParams(SWITCH_URL, { baseUrl: this.switcher?.baseUrl, sourceId: source.id }), {
      transitionType: transitionType,
      transitionMs: transitionMs,
    })
  }

  @ExecuteInMainProcess()
  public async getOutput(): Promise<Output> {
    return (await axios.get(replaceUrlParams(GET_OUTPUT_URL, { baseUrl: this.switcher?.baseUrl }))).data as Output;
  }

  @ExecuteInMainProcess()
  public async updateOutput(request: UpdateOutputRequest): Promise<Output> {
    return (await axios.put(replaceUrlParams(UPDATE_OUTPUT_URL, { baseUrl: this.switcher?.baseUrl }), request)).data as Output;
  }

  @ExecuteInMainProcess()
  public async getPreview(): Promise<Preview> {
    return (await axios.get(replaceUrlParams(GET_PREVIEW_URL, { baseUrl: this.switcher?.baseUrl }))).data as Preview;
  }

  @ExecuteInMainProcess()
  public async updatePreview(request: UpdatePreviewRequest): Promise<Preview> {
    return (await axios.put(replaceUrlParams(UPDATE_PREVIEW_URL, { baseUrl: this.switcher?.baseUrl }), request)).data as Preview;
  }

  @ExecuteInMainProcess()
  public async getAudio(): Promise<AudioResponse> {
    return (await axios.get(replaceUrlParams(GET_AUDIO_URL, { baseUrl: this.switcher?.baseUrl }))).data as AudioResponse;
  }

  @ExecuteInMainProcess()
  public async updateAudio(request: UpdateAudioRequest): Promise<void> {
    await axios.patch(replaceUrlParams(UPDATE_AUDIO_URL, { baseUrl: this.switcher?.baseUrl }), request);
  }

  @ExecuteInMainProcess()
  public async getOverlays(): Promise<Overlay[]> {
    return (await axios.get(replaceUrlParams(GET_OVERLAYS_URL, { baseUrl: this.switcher?.baseUrl }))).data as Overlay[];
  }

  @ExecuteInMainProcess()
  public async addOverlay(cg: CG): Promise<Overlay> {
    return (await axios.post(replaceUrlParams(ADD_OVERLAY_URL, { baseUrl: this.switcher?.baseUrl }), as<OverlayRequestWrapper>({
      overlay: removeKey(cg, 'id'),
    }))).data as Overlay;
  }

  @ExecuteInMainProcess()
  public async updateOverlay(overlay: Overlay): Promise<Overlay> {
    return (await axios.put(replaceUrlParams(UPDATE_OVERLAY_URL, { baseUrl: this.switcher?.baseUrl, overlayId: overlay.id }), as<OverlayRequestWrapper>({
      overlay: removeKey(overlay, 'id'),
    }))).data as Overlay;
  }

  @ExecuteInMainProcess()
  public async deleteOverlay(overlay: Overlay): Promise<void> {
    await axios.delete(replaceUrlParams(REMOVE_OVERLAY_URL, { baseUrl: this.switcher?.baseUrl, overlayId: overlay.id }));
  }

  @ExecuteInMainProcess()
  public async upOverlay(overlayId: string): Promise<void> {
    await axios.post(replaceUrlParams(UP_OVERLAY_URL, { baseUrl: this.switcher?.baseUrl, overlayId: overlayId }));
  }

  @ExecuteInMainProcess()
  public async downOverlay(overlayId: string): Promise<void> {
    await axios.post(replaceUrlParams(DOWN_OVERLAY_URL, { baseUrl: this.switcher?.baseUrl, overlayId: overlayId }));
  }
}
