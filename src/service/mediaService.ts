import axios from 'axios';
import { Service } from 'typedi';
import { MEDIA_BASE_URL } from '../common/constant';
import { Image } from '../common/types';

const SEARCH_IMAGE_URL = `${MEDIA_BASE_URL}/v1/media`;

@Service()
export class MediaService {

  public async searchImages(name: string): Promise<Image[]> {
      return (await axios.get(SEARCH_IMAGE_URL, {
        params: name ? { name } : {},
      })).data as Image[];
  }
}
