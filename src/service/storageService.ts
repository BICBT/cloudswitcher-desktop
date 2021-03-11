import Store from 'electron-store';
import { Service } from 'typedi';
import { CG } from '../common/types';

const STORAGE_KEY_CGS = 'cgs';

@Service()
export class StorageService {
  private readonly store = new Store();

  public saveCGs(cgs: CG[]) {
    this.store.set(STORAGE_KEY_CGS, cgs);
  }

  public loadCGs() {
    return this.store.get(STORAGE_KEY_CGS, []);
  }
}
