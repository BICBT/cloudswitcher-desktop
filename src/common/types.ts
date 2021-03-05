export interface Audio {
  masterVolume: number;
  audioWithVideo: boolean;
}

export interface Source {
  id: string;
  index: number;
  sceneId: string;
  name: string;
  url: string;
  previewUrl: string;
  volume: number;
  audioLock: boolean;
  audioMonitor: boolean;
}

export interface Output {
  url: string;
  previewUrl: string;
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

export interface GetSourceResponse {
  volume: number;
  audioLock: boolean;
  audioMonitor: boolean;
}

export interface UpdateSourceRequest {
  volume?: number;
  audioLock?: boolean;
  audioMonitor?: boolean;
}

export interface UpdateAudioRequest {
  audioWithVideo?: boolean;
}

export interface DialogProps<T> {
  onModalCancel: () => void;
  onModalDone: (result: T) => void;
  defaultValue: any;
}

export type DialogComponent =
  | 'AddSourceDialog'
  | 'OutputSettingDialog'
  | 'CGDesignerDialog';

export interface DialogOptions {
  title: string;
  component: DialogComponent;
  width: number;
  height: number;
}

export interface CG {
  id: string;
  name: string;
  snapshotBase64: string;
  items: CGItem[];
}

export type CGItemType = 'image' | 'text';

export interface CGItem {
  type: CGItemType;
  x: number;
  y: number;
  width: number;
  height: number;
  layer: number;
}

export interface CGText extends CGItem {
  content: string;
  fontSize: number;
  fontFamily: string;
  colorHex: string;
}

export interface CGImage extends CGItem {
  url: string;
}

export interface Image {
  id: string;
  name: string;
  url: string;
}
