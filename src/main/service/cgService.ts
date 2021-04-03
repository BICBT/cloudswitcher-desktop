import { Container, Service } from 'typedi';
import axios from 'axios';
import { CG, Overlay } from '../../common/types';
import { OBS_SERVER_URL } from '../../common/constant';
import { broadcastMessage, replaceUrlParams } from '../../common/util';
import { ipcMain } from "electron";
import { ObsService } from './obsService';

const GET_OVERLAYS_URL = `${OBS_SERVER_URL}/v1/overlays`;
const ADD_OVERLAY_URL = `${OBS_SERVER_URL}/v1/overlays`;
const UPDATE_OVERLAY_URL = `${OBS_SERVER_URL}/v1/overlays/:overlayId`;
const REMOVE_OVERLAY_URL = `${OBS_SERVER_URL}/v1/overlays/:overlayId`;
const UP_OVERLAY_URL = `${OBS_SERVER_URL}/v1/overlays/:overlayId/up`;
const DOWN_OVERLAY_URL = `${OBS_SERVER_URL}/v1/overlays/:overlayId/down`;

@Service()
export class CGService {
  private readonly obsService = Container.get(ObsService);

  public cgs: CG[] = [];

  public async initialize() {
    ipcMain.on('getCGs', event => event.returnValue = this.cgs);
    ipcMain.on('addCG', (event, cg) => this.addCG(cg));
    ipcMain.on('updateCG', (event, cg) => this.updateCG(cg));
    ipcMain.on('deleteCG', (event, cg) => this.deleteCG(cg));
    ipcMain.on('upCG', (event, cg) => this.upCG(cg));
    ipcMain.on('downCG', (event, cg) => this.downCG(cg));

    this.cgs = ((await axios.get(GET_OVERLAYS_URL)).data as Overlay[])
      .filter(o => o.type === 'cg') as CG[];
    this.cgs.forEach(cg => {
      this.obsService.addOverlay(cg);
      if (cg.status === 'up') {
        this.obsService.upOverlay(cg.id);
      }
    });
  }

  public async addCG(cg: CG) {
    try {
      await axios.post(ADD_OVERLAY_URL, cg);
      this.obsService.addOverlay(cg);
      this.cgs.push(cg);
    } catch (e) {
      console.error(e);
    }
    broadcastMessage('cgsChanged', this.cgs);
  }

  public async updateCG(cg: CG) {
    try {
      console.log(`cg = ${JSON.stringify(cg)}`);
      await axios.put(replaceUrlParams(UPDATE_OVERLAY_URL, { overlayId: cg.id }), cg);
      this.obsService.updateOverlay(cg);
      if (cg.status === 'up') {
        this.obsService.upOverlay(cg.id);
      }
    } catch (e) {
      console.error(e);
    }
    const index = this.cgs.findIndex(c => c.id === cg.id);
    if (index < 0) {
      throw new Error(`Can't find cg ${cg.id}`);
    }
    this.cgs[index] = cg;
    broadcastMessage('cgsChanged', this.cgs);
  }

  public async deleteCG(cg: CG) {
    await axios.delete(replaceUrlParams(REMOVE_OVERLAY_URL, { overlayId: cg.id }));
    this.obsService.removeOverlay(cg.id);
    this.cgs = this.cgs.filter(c => c.id !== cg.id);
    broadcastMessage('cgsChanged', this.cgs);
  }

  public async upCG(cg: CG) {
    const existing = this.cgs.find(c => c.id === cg.id);
    if (!existing) {
      throw new Error(`Can't find cg ${cg.id}`);
    }
    await axios.post(replaceUrlParams(UP_OVERLAY_URL, { overlayId: existing.id }));
    this.obsService.upOverlay(cg.id);
    existing.status = 'up';
    broadcastMessage('cgsChanged', this.cgs);
  }

  public async downCG(cg: CG) {
    const existing = this.cgs.find(c => c.id === cg.id);
    if (!existing) {
      throw new Error(`Can't find cg ${cg.id}`);
    }
    await axios.post(replaceUrlParams(DOWN_OVERLAY_URL, { overlayId: existing.id }));
    this.obsService.downOverlay(cg.id);
    existing.status = 'down';
    broadcastMessage('cgsChanged', this.cgs);
  }
}
