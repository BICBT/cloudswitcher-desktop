import { Service } from 'typedi';
import { ipcRenderer } from 'electron';

@Service()
export class DisplayService {

  public createOBSDisplay(name: string, electronWindowId: number, scaleFactor: number, sourceId: string): void {
    ipcRenderer.send('createOBSDisplay', name, electronWindowId, scaleFactor, sourceId);
  }

  public moveOBSDisplay(name: string, x: number, y: number, width: number, height: number): void {
    ipcRenderer.send('moveOBSDisplay', name, x, y, width, height);
  }

  public destroyOBSDisplay(name: string): void {
    ipcRenderer.send('destroyOBSDisplay', name);
  }
}
