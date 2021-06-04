import { Container, Service } from 'typedi';
import axios from 'axios';
import * as Sentry from '@sentry/electron';
import { LoginResponse } from '../common/types';
import { AUTH_BASE_URL } from '../common/constant';
import { StorageService } from './StorageService';

const LOGIN_URL = `${AUTH_BASE_URL}/v1/token`;

@Service()
export class AuthService {
  private readonly storageService = Container.get(StorageService);

  public async login(username: string, password: string): Promise<void> {
    const res = (await axios.post<LoginResponse>(LOGIN_URL, { username, password })).data as LoginResponse;
    Sentry.setUser({
      username: username,
    });
    await this.storageService.setToken(res.token);
  }
}
