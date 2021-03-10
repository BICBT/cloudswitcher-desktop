import { Service } from 'typedi';
import { ipcRenderer } from "electron";
import { CG } from '../common/types';
import { SimpleEvent } from '../common/event';

@Service()
export class CGService {
  public cgsChanged = new SimpleEvent<CG[]>();

  public initialize(): void {
    ipcRenderer.on('cgsChanged', (event, cgs: CG[]) => {
      this.cgsChanged.emit(cgs);
    });
  }

  public getCGs(): CG[] {
    return ipcRenderer.sendSync('getCGs');
  }

  public addCG(cg: CG) {
    ipcRenderer.send('addCG', cg);
  }

  public updateCG(cg: CG) {
    ipcRenderer.send('updateCG', cg);
  }

  public deleteCG(cg: CG) {
    ipcRenderer.send('deleteCG', cg);
  }

  public upCG(cg: CG) {
    ipcRenderer.send('upCG', cg);
  }

  public downCG(cg: CG) {
    ipcRenderer.send('downCG', cg);
  }
}
