import { Service } from 'typedi';
import { autoUpdater } from 'electron-updater';
import { ExecuteInMainProcess, IpcEvent } from '../common/ipc';
import { getPackageVersion } from "../common/util";

@Service()
export class UpdateService {
  public downloadProgress: IpcEvent<{ percent: number }> = new IpcEvent<{ percent: number }>('downloadProgress');
  public downloaded: IpcEvent<void> = new IpcEvent<void>('downloaded');

  public initialize(): void {
    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = false;
    autoUpdater.on('download-progress', (progress: { percent: number }) => {
      this.downloadProgress.emit({ percent: progress.percent });
    });
    autoUpdater.on('update-downloaded', () => {
      this.downloaded.emit();
    });
  }

  @ExecuteInMainProcess()
  public async checkNewVersion(): Promise<string | false> {
    try {
      const version = getPackageVersion();
      const newVersion = (await autoUpdater.checkForUpdates()).updateInfo.version;
      return version !== newVersion ? newVersion : false;
    } catch (e) {
     console.error(`Failed to check version: ${e}`);
     return false;
    }
  }

  @ExecuteInMainProcess()
  public async downloadUpdate(): Promise<void> {
    await autoUpdater.downloadUpdate();
  }

  @ExecuteInMainProcess()
  public async quitAndInstall(): Promise<void> {
    await autoUpdater.quitAndInstall();
  }
}
