import axios from 'axios';
import { Service } from 'typedi';
import { MEDIA_BASE_URL } from '../../common/constant';
import { Image } from '../../common/types';
import { ipcMain } from "electron";
import { broadcastMessage } from '../../common/util';

const SEARCH_IMAGE_URL = `${MEDIA_BASE_URL}/v1/media`;

@Service()
export class MediaService {

  public initialize() {
    ipcMain.on('searchImages', (event, name) => this.searchImages(name));
  }

  public async searchImages(name: string): Promise<void> {
    const images = (await axios.get(SEARCH_IMAGE_URL, {
      params: name ? { name } : {},
    })).data as Image[];
    broadcastMessage('searchImagesResult', images);
  }
}
