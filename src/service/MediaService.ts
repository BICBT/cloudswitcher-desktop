import axios from 'axios';
import { Service } from 'typedi';
import { MEDIA_BASE_URL } from '../common/constant';
import { Image } from '../common/types';
import { ServiceBase } from './ServiceBase';

const SEARCH_IMAGE_URL = `${MEDIA_BASE_URL}/v1/media`;

@Service()
export class MediaService extends ServiceBase {

  public async initialize(): Promise<void> {
  }

  public async searchImages(name: string): Promise<Image[]> {
    const params = {
      ...(name ? { name } : undefined)
    };
    return (await axios.get(SEARCH_IMAGE_URL, { params })).data as Image[];
  }
}
