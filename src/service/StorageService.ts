import Store from 'electron-store';
import { Service } from 'typedi';
import { ExecuteInMainProcess } from '../common/ipc';

const STORAGE_KEY_TOKEN = 'TOKEN';

@Service()
export class StorageService {
  private readonly store = new Store();

  @ExecuteInMainProcess()
  public async setToken(token: string): Promise<void> {
    this.store.set(STORAGE_KEY_TOKEN, token);
  }

  @ExecuteInMainProcess()
  public async getToken(): Promise<string | undefined> {
    return this.store.get(STORAGE_KEY_TOKEN);
  }
}
