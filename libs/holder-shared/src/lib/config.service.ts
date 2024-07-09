import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom, timeout } from 'rxjs';
import { EndpointResponse } from '@credhub/holder-shared';

class LoadedAppConfig {
  backendUrl!: string;
}
class AppConfig extends LoadedAppConfig {
  oidcUrl!: string;
  oidcClient!: string;
  oidcAllowHttp!: boolean;
  name!: string;
}

@Injectable({
  providedIn: 'root',
})
export class ConfigService {
  config!: AppConfig;
  defaultBackend!: string;

  constructor(private httpClient: HttpClient) {}

  loadConfig(config: AppConfig) {
    this.config = config;
  }

  getConfig<T>(key: keyof AppConfig): T {
    return this.config[key] as T;
  }

  getPersistedBackend() {
    return localStorage.getItem('backend');
  }

  isConfigUrl(url: string) {
    return (
      (this.getPersistedBackend() &&
        `${this.getPersistedBackend()}/auth` === url) ||
      `${this.defaultBackend}/auth` === url
    );
  }

  getDefaultBackend(): string {
    return this.defaultBackend;
  }

  changeBackend(input: string) {
    return firstValueFrom(
      this.httpClient.get<EndpointResponse>(`${input}/auth`)
    ).then(
      () => localStorage.setItem('backend', input),
      (err: HttpErrorResponse) => {
        console.log(err);
        throw Error();
      }
    );
  }

  /**
   * Use the value from the localstorage, otherwhise use the value from the config file
   * @param http
   * @returns
   */
  async appConfigLoader(http: HttpClient) {
    this.defaultBackend = await firstValueFrom(
      http.get<LoadedAppConfig>('/assets/config/config.json')
    ).then((config) => config.backendUrl);
    const backendUrl = this.getPersistedBackend() ?? this.defaultBackend;
    const response = await firstValueFrom(
      http.get<EndpointResponse>(`${backendUrl}/auth`).pipe(timeout(2000))
    ).catch((err) => {
      console.log(err);
      return firstValueFrom(
        http
          .get<EndpointResponse>(`${this.defaultBackend}/auth`)
          .pipe(timeout(2000))
      );
    });
    this.loadConfig({
      backendUrl: backendUrl as string,
      ...response,
    });
  }
}
