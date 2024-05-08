import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

class AppConfig {
  issuerUrl!: string;
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

  loadConfig(config: AppConfig) {
    this.config = config;
  }

  getConfig<T>(key: keyof AppConfig): T {
    return this.config[key] as T;
  }

  static appConfigLoader(configService: ConfigService, http: HttpClient) {
    return () => {
      return firstValueFrom(http.get<AppConfig>('/assets/config.json'))
        .then((config) => configService.loadConfig(config))
        .catch((error) => {
          console.error('Error loading config file:', error);
          return Promise.reject('Error loading config file');
        });
    };
  }
}
