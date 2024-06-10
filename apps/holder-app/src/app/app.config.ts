import {
  type ApplicationConfig,
  importProvidersFrom,
  APP_INITIALIZER,
  isDevMode,
} from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import {
  HttpClient,
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { MAT_DIALOG_DEFAULT_OPTIONS } from '@angular/material/dialog';
import { OAuthModuleConfig, provideOAuthClient } from 'angular-oauth2-oidc';
import {
  ApiModule,
  Configuration,
  AuthServiceInterface,
} from '@my-wallet/holder-shared';
import { AuthService } from './auth/auth.service';
import { provideServiceWorker } from '@angular/service-worker';
import { ConfigService } from './config.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAnimations(),
    provideOAuthClient(),
    provideHttpClient(withInterceptorsFromDi()),
    importProvidersFrom(ApiModule),
    { provide: MAT_DIALOG_DEFAULT_OPTIONS, useValue: { hasBackdrop: true } },
    {
      provide: APP_INITIALIZER,
      useFactory:
        (
          authService: AuthService,
          configService: ConfigService,
          httpClient: HttpClient
        ) =>
        async () => {
          await configService.appConfigLoader(httpClient);
          authService.init();
          await authService.runInitialLoginSequence();
        },
      deps: [AuthService, ConfigService, HttpClient],
      multi: true,
    },
    {
      provide: OAuthModuleConfig,
      useFactory: (configService: ConfigService) => {
        return {
          resourceServer: {
            sendAccessToken: true,
            customUrlValidation: (url: string) => {
              // we need to ignore calls to assets to fetch the config file
              if (url.startsWith('/assets')) return true;
              return url.startsWith(configService.getConfig('backendUrl'));
            },
          },
        };
      },
      deps: [ConfigService],
      multi: false,
    },
    {
      provide: Configuration,
      useFactory: (configService: ConfigService, authService: AuthService) =>
        new Configuration({
          basePath: configService.getConfig('backendUrl'),
          credentials: {
            oauth2: () => authService.accessToken,
          },
        }),
      deps: [ConfigService, AuthService],
      multi: false,
    },
    {
      provide: AuthServiceInterface,
      useClass: AuthService,
    },
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
