import { Service } from 'typedi';
import { ipcRenderer } from "electron";
import { Image } from '../common/types';
import { SimpleEvent } from '../common/event';

@Service()
export class MediaService {
  public searchImagesResult = new SimpleEvent<Image[]>();

  public initialize(): void {
    ipcRenderer.on('searchImagesResult', (event, images: Image[]) => {
      this.searchImagesResult.emit(images);
    });
  }

  public searchImages(name: string) {
    ipcRenderer.send('searchImages', name);
  }
}
