export type AudioMode = 'follow' | 'standalone';

export enum RateControl {
  CBR = 'CBR',
  VBR = 'VBR',
}

export enum Preset {
  ultrafast = 'ultrafast',
  veryfast = 'veryfast',
  fast = 'fast',
  medium = 'medium',
}

export enum Profile {
  baseline = 'baseline',
  main = 'main',
}

export enum Tune {
  zerolatency = 'zerolatency',
  default = 'default',
}

export interface AudioResponse {
  volume: number;
  mode: AudioMode;
}

export interface Audio extends AudioResponse {
  monitor: boolean;
}

export interface UpdateAudioRequest {
  volume?: number;
  mode?: AudioMode;
}

export interface SourceResponse {
  id: string;
  index: number;
  name: string;
  url: string;
  customPreviewUrl: string | null;
  previewUrl: string;
  hardwareDecoder?: boolean;
  volume: number;
  audioLock: boolean;
}

export interface Source extends SourceResponse {
  monitor: boolean;
}

export interface AddSourceRequest {
  index: number;
  name: string;
  type: SourceType;
  url: string;
  customPreviewUrl?: string;
  hardwareDecoder?: boolean;
}

export interface UpdateSourceRequest {
  name?: string;
  type?: SourceType;
  url?: string;
  customPreviewUrl?: string | null;
  hardwareDecoder?: boolean;
  volume?: number;
  audioLock?: boolean;
}

export interface Encoding {
  width: number;
  height: number;
  fpsNum: number;
  fpsDen: number;
  rateControl: RateControl;
  preset: Preset;
  profile: Profile;
  tune: Tune;
  keyIntSec: number;
  videoBitrateKbps: number;
  samplerate: number;
  audioBitrateKbps: number;
  hardwareEnable: boolean;
}

export interface Output {
  id: string;
  url: string;
  encoding: Encoding;
  previewUrl: string;
}

export interface Preview  {
  encoding: Encoding;
}

export enum TransitionType {
  Cut = 'cut_transition',
  Fade = 'fade_transition',
  Swipe = 'swipe_transition',
  Slide = 'slide_transition',
}

export interface Transition {
  id: string;
  type: TransitionType;
  source: Source;
}

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Volmeter {
  magnitude: number[];
  peak: number[];
  inputPeak: number[];
}

export interface DialogProps<Default, Result> {
  onModalCancel: () => void;
  onModalDone: (result: Result) => void;
  default: Default;
}

export type DialogComponent =
  | 'SourceDialog'
  | 'PreferenceDialog'
  | 'CGDesignerDialog';

export interface DialogOptions {
  title: string;
  component: DialogComponent;
  width: number;
  height: number;
}

export type OverlayType = 'cg';
export type OverlayStatus = 'up' | 'down';

export interface Overlay {
  id: string;
  name: string;
  type: OverlayType;
  status: OverlayStatus;
}

export interface CG extends Overlay {
  items: CGItem[];
  baseWidth: number;
  baseHeight: number;
}

export type CGItemType = 'image' | 'text';

export interface CGItem {
  type: CGItemType;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CGText extends CGItem {
  content: string;
  fontSize: number;
  fontFamily: string;
  colorABGR: string;
}

export interface CGImage extends CGItem {
  url: string;
}

export interface OverlayRequestWrapper {
  overlay: Omit<Overlay, 'id'>;
}

export interface Image {
  id: string;
  name: string;
  url: string;
}

export interface LoginInfo {
  username: string,
  password: string;
}

export interface LoginResponse {
  token: string;
}

export interface Switcher {
  id: string;
  name: string;
  bitrate: number;
  code: string;
  format: string;
  region: string;
  recordingenable: boolean;
  switcherstatus:string;
  host: string;
  baseUrl: string;
}

export enum SourceType {
  live = 'live',
  media = 'media',
}

export enum StreamType {
  rtmp = 'rtmp',
  srt = 'srt'
}

export interface UpdateOutputRequest {
  url: string;
  encoding: Encoding;
}

export interface UpdatePreviewRequest {
  encoding: Encoding;
}
