import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

class AppConfig {
  backendUrl!: string;
  oidcUrl!: string;
  oidcClient!: string;
  oidcRequireHttps!: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ConfigService {
  config!: AppConfig;

  loadConfig(config: AppConfig) {
    this.config = config;
  }

  getConfig<T>(key: keyof AppConfig): T {
    return this.config[key] as T;
  }

  appConfigLoader(http: HttpClient) {
    return firstValueFrom(
      http.get<AppConfig>('/assets/config/config.json')
    ).then(
      (config) => this.loadConfig(config),
      (error) => {
        console.error('Error loading config file:', error);
        return Promise.reject('Error loading config file');
      }
    );
  }
}
