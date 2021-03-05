import { Container, Service } from 'typedi';
import { CG } from '../common/types';
import { StorageService } from './storageService';

@Service()
export class CGService {
  private readonly storageService = Container.get(StorageService);

  public cgs: CG[] = [];

  public initialize() {
    this.cgs = this.storageService.loadCGs();
  }

  public saveCG(cg: CG) {
    const index = this.cgs.findIndex(c => c.id === cg.id);
    if (index === -1) {
      this.cgs.push(cg);
    } else {
      this.cgs[index] = cg;
    }
    this.storageService.saveCGs(this.cgs);
  }

  public deleteCG(cg: CG) {
    this.cgs = this.cgs.filter(c => c.id !== cg.id);
    this.storageService.saveCGs(this.cgs);
  }
}
