import { ipcRenderer } from 'electron';
import { Service } from 'typedi';
import { SimpleEvent } from '../common/event';
import { Source, Transition, TransitionType, UpdateSourceRequest } from '../common/types';

@Service()
export class SourceService {
  public sourcesChanged = new SimpleEvent<Record<number, Source>>();
  public previewChanged = new SimpleEvent<Source>();
  public programChanged = new SimpleEvent<Transition>();
  public liveChanged = new SimpleEvent<Source | undefined>();
  public sourceRestarted = new SimpleEvent<Source>();
  public sourceChanged = new SimpleEvent<Source>();
  public screenshotted = new SimpleEvent<{ source: Source, base64: string }>();

  public initialize(): void {
    ipcRenderer.on('sourcesChanged', (event, sources: Record<number, Source>) => {
      this.sourcesChanged.emit(sources);
    });
    ipcRenderer.on('previewChanged', (event, source: Source) => {
      this.previewChanged.emit(source);
    });
    ipcRenderer.on('programChanged', (event, transition: Transition) => {
      this.programChanged.emit(transition);
    });
    ipcRenderer.on('liveChanged', (event, source: Source) => {
      this.liveChanged.emit(source);
    });
    ipcRenderer.on('sourceRestarted', (event, source: Source) => {
      this.sourceRestarted.emit(source);
    });
    ipcRenderer.on('sourceChanged', (event, source: Source) => {
      this.sourceChanged.emit(source);
    });
    ipcRenderer.on('screenshotted', (event, source: Source, base64: string) => {
      this.screenshotted.emit({ source, base64 });
    });
  }

  public get sources(): Record<number, Source> {
    return ipcRenderer.sendSync('getSources');
  }

  public get previewSource(): Source {
    return ipcRenderer.sendSync('getPreviewSource');
  }

  public get programTransition(): Transition {
    return ipcRenderer.sendSync('getProgramTransition');
  }

  public get liveSource(): Source {
    return ipcRenderer.sendSync('getLiveSource');
  }

  public restart(source: Source): void {
    ipcRenderer.send('restart', source);
  }

  public preview(source: Source): void {
    ipcRenderer.send('preview', source);
  }

  public take(source: Source, transitionType: TransitionType, transitionDurationMs: number): void {
    ipcRenderer.send('take', source, transitionType, transitionDurationMs);
  }

  public updateLiveUrl(url: string): void {
    ipcRenderer.send('updateLiveUrl', url);
  }

  public updateSource(source: Source, request: UpdateSourceRequest) {
    ipcRenderer.send('updateSource', source, request);
  }

  public screenshot(source: Source) {
    ipcRenderer.send('screenshot', source);
  }
}
