import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

interface AuthResponse {
  access_token: string;
  expires_in: number;
  refresh_expires_in: number;
  token_type: string;
  'not-before-policy': number;
}

class AppConfig {
  verifierUrl!: string;
  credentialId!: string;
  tokenEndpoint!: string;
  clientId!: string;
  clientSecret!: string;
}

@Injectable({
  providedIn: 'root',
})
export class ConfigService {
  private config!: AppConfig;
  accessToken?: string;

  constructor(private httpClient: HttpClient) {}

  loadConfig(config: AppConfig) {
    this.config = config;
  }

  getConfig<T>(key: keyof AppConfig): T {
    return this.config[key] as T;
  }

  static appConfigLoader(configService: ConfigService, http: HttpClient) {
    return () => {
      return firstValueFrom(http.get<AppConfig>('/assets/config.json'))
        .then((config) => {
          configService.loadConfig(config);
          configService.authenticateWithKeycloak();
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
    )}&client_secret=${this.getConfig('clientSecret')}`;

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
