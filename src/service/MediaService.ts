import axios from 'axios';
import { Service } from 'typedi';
import { MEDIA_BASE_URL } from '../common/constant';
import { Media, MediaType } from '../common/types';
import { replaceUrlParams } from '../common/util';

const GET_MEDIAS_URL = `${MEDIA_BASE_URL}/v1/medias`;
const GET_MEDIA_URL = `${MEDIA_BASE_URL}/v1/medias/:mediaId`;
const ADD_MEDIA_URL = `${MEDIA_BASE_URL}/v1/medias`;

@Service()
export class MediaService {

  public async getMedias(type: MediaType, name: string): Promise<Media[]> {
    const params = {
      type: type,
      ...(name ? { name } : undefined)
    };
    return (await axios.get(GET_MEDIAS_URL, { params })).data as Media[];
  }

  public async getMedia(mediaId: string): Promise<Media> {
    return (await axios.get(replaceUrlParams(GET_MEDIA_URL, { mediaId }))).data as Media;
  }

  public async addMedia(file: File): Promise<Media> {
    const formData = new FormData();
    formData.append("file", file);

    return (await axios.post(ADD_MEDIA_URL, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })).data as Media;
  }
}
