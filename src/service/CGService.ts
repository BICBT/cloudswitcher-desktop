import { Container, Service } from 'typedi';
import { CG } from '../common/types';
import { isMainProcess } from '../common/util';
import { ObsService } from './ObsService';
import { ExecuteInMainProcess, IpcEvent } from './IpcService';
import { SwitcherService } from './SwitcherService';

@Service()
export class CGService {
  private readonly switcherService = Container.get(SwitcherService);
  private readonly obsService = Container.get(ObsService);
  private cgs: CG[] = []
  public cgsChanged: IpcEvent<CG[]> = new IpcEvent<CG[]>('cgsChanged');

  public async initialize(): Promise<void> {
    if (!isMainProcess()) {
      return;
    }
    this.cgs = (await this.switcherService.getOverlays()).filter(o => o.type === 'cg') as CG[];
    this.cgs.forEach(cg => {
      this.obsService.addOverlay(cg);
      if (cg.status === 'up') {
        this.obsService.upOverlay(cg.id);
      }
    });
  }

  @ExecuteInMainProcess()
  public async getCGs(): Promise<CG[]> {
    return this.cgs;
  }

  @ExecuteInMainProcess()
  public async addCG(cg: CG) {
    cg = await this.switcherService.addOverlay(cg) as CG;
    await this.obsService.addOverlay(cg);
    this.cgs.push(cg);
    this.cgsChanged.emit(this.cgs);
  }

  @ExecuteInMainProcess()
  public async updateCG(cg: CG) {
    cg = await this.switcherService.updateOverlay(cg) as CG;
    await this.obsService.updateOverlay(cg);
    const index = this.cgs.findIndex(c => c.id === cg.id);
    if (index < 0) {
      throw new Error(`Can't find cg ${cg.id}`);
    }
    this.cgs[index] = cg;
    this.cgsChanged.emit(this.cgs);
  }

  @ExecuteInMainProcess()
  public async deleteCG(cg: CG) {
    await this.switcherService.deleteOverlay(cg);
    await this.obsService.removeOverlay(cg.id);
    this.cgs = this.cgs.filter(c => c.id !== cg.id);
    this.cgsChanged.emit(this.cgs);
  }

  @ExecuteInMainProcess()
  public async upCG(cg: CG) {
    const existing = this.cgs.find(c => c.id === cg.id);
    if (!existing) {
      throw new Error(`Can't find cg ${cg.id}`);
    }
    await this.switcherService.upOverlay(existing.id);
    await this.obsService.upOverlay(cg.id);
    existing.status = 'up';
    this.cgsChanged.emit(this.cgs);
  }

  @ExecuteInMainProcess()
  public async downCG(cg: CG) {
    const existing = this.cgs.find(c => c.id === cg.id);
    if (!existing) {
      throw new Error(`Can't find cg ${cg.id}`);
    }
    await this.switcherService.downOverlay(existing.id);
    await this.obsService.downOverlay(cg.id);
    existing.status = 'down';
    this.cgsChanged.emit(this.cgs);
  }
}
