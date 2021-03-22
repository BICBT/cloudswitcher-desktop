import { Container, Service } from 'typedi';
import axios from 'axios';
import { CG, Overlay } from '../common/types';
import { OBS_SERVER_URL } from '../common/constant';
import { isMainProcess, replaceUrlParams } from '../common/util';
import { ObsService } from './ObsService';
import { ExecuteInMainProcess, IpcEvent } from './IpcService';
import { ServiceBase } from './ServiceBase';

const GET_OVERLAYS_URL = `${OBS_SERVER_URL}/v1/overlays`;
const ADD_OVERLAY_URL = `${OBS_SERVER_URL}/v1/overlays`;
const UPDATE_OVERLAY_URL = `${OBS_SERVER_URL}/v1/overlays/:overlayId`;
const REMOVE_OVERLAY_URL = `${OBS_SERVER_URL}/v1/overlays/:overlayId`;
const UP_OVERLAY_URL = `${OBS_SERVER_URL}/v1/overlays/:overlayId/up`;
const DOWN_OVERLAY_URL = `${OBS_SERVER_URL}/v1/overlays/:overlayId/down`;

@Service()
export class CGService extends ServiceBase {
  private readonly obsService = Container.get(ObsService);
  private cgs: CG[] = []
  public cgsChanged: IpcEvent<CG[]> = new IpcEvent<CG[]>('cgsChanged');

  public async initialize(): Promise<void> {
    if (isMainProcess()) {
      this.cgs = ((await axios.get(GET_OVERLAYS_URL)).data as Overlay[])
        .filter(o => o.type === 'cg') as CG[];
      this.cgs.forEach(cg => {
        this.obsService.addOverlay(cg);
        if (cg.status === 'up') {
          this.obsService.upOverlay(cg.id);
        }
      });
    }
  }

  @ExecuteInMainProcess()
  public async getCGs(): Promise<CG[]> {
    return this.cgs;
  }

  @ExecuteInMainProcess()
  public async addCG(cg: CG) {
    await axios.post(ADD_OVERLAY_URL, cg);
    await this.obsService.addOverlay(cg);
    this.cgs.push(cg);
    this.cgsChanged.emit(this.cgs);
  }

  @ExecuteInMainProcess()
  public async updateCG(cg: CG) {
    await axios.put(replaceUrlParams(UPDATE_OVERLAY_URL, { overlayId: cg.id }), cg);
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
    await axios.delete(replaceUrlParams(REMOVE_OVERLAY_URL, { overlayId: cg.id }));
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
    await axios.post(replaceUrlParams(UP_OVERLAY_URL, { overlayId: existing.id }));
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
    await axios.post(replaceUrlParams(DOWN_OVERLAY_URL, { overlayId: existing.id }));
    await this.obsService.downOverlay(cg.id);
    existing.status = 'down';
    this.cgsChanged.emit(this.cgs);
  }
}
