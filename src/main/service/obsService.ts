import { Service } from 'typedi';
import * as obs from '../../obs-api';
import { app, BrowserWindow, ipcMain } from 'electron';
import { Source, Transition, TransitionType } from '../../types/obs';
import * as uuid from 'uuid';
import * as path from 'path';

const DEFAULT_SOURCE_SETTINGS = {
  buffering_mb: 2,
  caching: false,
  clear_on_media_end: true,
  is_local_file: false,
  looping: false,
  restart_on_activate: true,
  speed_percent: 100,
};

@Service()
export class ObsService {
  private globalTransition?: obs.ITransition;
  private globalScene?: obs.IScene;
  private readonly transitions: Map<TransitionType, obs.ITransition> = new Map<TransitionType, obs.ITransition>();

  public initialize() {
    // Host a new OBS server instance
    obs.IPC.host(uuid.v4());
    obs.NodeObs.SetWorkingDirectory(
      path.join(
        app.getAppPath().replace('app.asar', 'app.asar.unpacked'),
        'node_modules',
        'obs-studio-node',
      ),
    );

    // Initialize OBS API
    obs.NodeObs.OBS_API_initAPI(
      'en-US',
      app.getPath('userData'),
      process.env.APP_VERSION || '1.0.0',
    );

    // Add source to global transaction to make source readable
    this.globalTransition = obs.TransitionFactory.create(TransitionType.Cut, 'Global Transition');
    obs.Global.setOutputSource(0, this.globalTransition);
    this.globalScene = obs.SceneFactory.create('Global Scene');
    this.globalTransition.set(this.globalScene);

    ipcMain.on('createOBSDisplay', (event, electronWindowId: number, name: string, sourceId: string) => event.returnValue = this.createOBSDisplay(electronWindowId, name, sourceId));
    ipcMain.on('moveOBSDisplay', (event, name: string, x: number, y: number) => event.returnValue = this.moveOBSDisplay(name, x, y));
    ipcMain.on('resizeOBSDisplay', (event, name: string, width: number, height: number) => event.returnValue = this.resizeOBSDisplay(name, width, height));
    ipcMain.on('destroyOBSDisplay', (event, name: string) => event.returnValue = this.destroyOBSDisplay(name));
    ipcMain.on('createOBSIOSurface', (event, name: string) => event.returnValue = this.createOBSIOSurface(name));
  }

  public createSource(sourceId: string, url: string): void {
    const obsSource = obs.InputFactory.create('ffmpeg_source', sourceId, {
      ...DEFAULT_SOURCE_SETTINGS,
      input: url,
    });
    if (this.globalScene) {
      this.globalScene.add(obsSource);
    }
  }

  public removeSource(sourceId: string): void {
    const obsSource = obs.InputFactory.fromName(sourceId);
    if (obsSource) {
      obsSource.release();
    }
  }

  public createOBSDisplay(electronWindowId: number, name: string, sourceId: string): void {
    console.log(`createOBSDisplay: ${electronWindowId} ${name}`);
    const electronWindow = BrowserWindow.fromId(electronWindowId);
    obs.NodeObs.OBS_content_createSourcePreviewDisplay(
      electronWindow.getNativeWindowHandle(),
      sourceId,
      name,
    );
    obs.NodeObs.OBS_content_setPaddingSize(name, 0);
  }

  public moveOBSDisplay(name: string, x: number, y: number): void {
    obs.NodeObs.OBS_content_moveDisplay(name, x, y);
  }

  public resizeOBSDisplay(name: string, width: number, height: number): void {
    obs.NodeObs.OBS_content_resizeDisplay(name, width, height);
  }

  public destroyOBSDisplay(name: string): void {
    obs.NodeObs.OBS_content_destroyDisplay(name);
  }

  public createOBSIOSurface(name: string): number {
    return obs.NodeObs.OBS_content_createIOSurface(name);
  }

  public switchSource(from: Source | undefined, to: Source, transitionType: TransitionType, transitionDurationMs: number): Transition {
    let obsTransition = this.transitions.get(transitionType);
    if (!obsTransition) {
      const transitionId = uuid.v4();
      obsTransition = obs.TransitionFactory.create(transitionType, transitionId);
      this.transitions.set(transitionType, obsTransition);
    }
    if (from) {
      const fromObsScene = obs.SceneFactory.fromName(from.id);
      obsTransition.set(fromObsScene);
    }
    const toObsScene = obs.SceneFactory.fromName(to.id);
    obsTransition.start(transitionDurationMs, toObsScene);
    return {
      id: obsTransition.name,
      type: transitionType,
      source: to,
    };
  }
}