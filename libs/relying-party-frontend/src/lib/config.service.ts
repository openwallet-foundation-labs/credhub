import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

interface AuthResponse {
  access_token: string;
  expires_in: number;
  refresh_expires_in: number;
  token_type: string;
  'not-before-policy': number;
  scope: string;
}

export class ConfigBasic {
  clientId!: string;
  clientSecret!: string;
  tokenEndpoint!: string;
}

@Injectable({
  providedIn: 'root',
})
export class ConfigService<Config extends ConfigBasic> {
  private config!: Config;
  accessToken?: string;

  constructor(private httpClient: HttpClient) {}

  loadConfig(config: Config) {
    this.config = config;
  }

  getConfig<T>(key: keyof Config): T {
    return this.config[key] as T;
  }

  appConfigLoader(http: HttpClient) {
    return () => {
      return firstValueFrom(http.get<Config>('/assets/config.json'))
        .then(async (config) => {
          this.loadConfig(config);
          await this.authenticateWithKeycloak();
        })
        .catch((error) => {
          console.error('Error loading config file:', error);
          return Promise.reject('Error loading config file');
        });
    };
  }

  getToken() {
    return this.accessToken;
  }

  private async authenticateWithKeycloak() {
    const body = `grant_type=client_credentials&client_id=${this.getConfig(
      'clientId'
    )}&client_secret=${this.getConfig<string>('clientSecret')}`;

    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded',
    });

    const response = await firstValueFrom(
      this.httpClient.post<AuthResponse>(
        this.getConfig('tokenEndpoint'),
        body,
        { headers }
      )
    );
    this.accessToken = response.access_token;
    setTimeout(
      () => this.authenticateWithKeycloak(),
      response.expires_in * 1000 - 10000
    );
  }
}
