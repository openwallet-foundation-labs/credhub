import {
  APP_INITIALIZER,
  ApplicationConfig,
  importProvidersFrom,
} from '@angular/core';
import { HttpClient, provideHttpClient } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import {
  ApiModule,
  Configuration,
  IssuerConfigService,
} from '@credhub/issuer-shared';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { MAT_SNACK_BAR_DEFAULT_OPTIONS } from '@angular/material/snack-bar';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(),
    provideRouter(routes),
    {
      provide: APP_INITIALIZER,
      useFactory: (
        configService: IssuerConfigService,
        httpClient: HttpClient
      ) => configService.appConfigLoader(httpClient, 'assets/config.json'),
      deps: [IssuerConfigService, HttpClient],
      multi: true,
    },
    provideAnimationsAsync(),
    importProvidersFrom(ApiModule),
    { provide: MAT_SNACK_BAR_DEFAULT_OPTIONS, useValue: { duration: 2500 } },
    {
      provide: Configuration,
      deps: [IssuerConfigService],
      useFactory: (configService: IssuerConfigService) => {
        return new Configuration({
          basePath: configService.getConfig('backendUrl'),
          credentials: {
            oauth2: () => configService.getToken(),
          },
        });
      },
    },
  ],
};
