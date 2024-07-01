import {
  APP_INITIALIZER,
  ApplicationConfig,
  importProvidersFrom,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { appRoutes } from './app.routes';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import {
  Configuration as IssuerConfiguration,
  ApiModule as IssuerApiModule,
  IssuerConfigService,
} from '@credhub/issuer-shared';
import {
  Configuration as VerifierConfiguration,
  ApiModule as VerifierApiModule,
  VerifierConfigService,
} from '@credhub/verifier-shared';
import { HttpClient, provideHttpClient } from '@angular/common/http';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(appRoutes),
    provideHttpClient(),
    provideAnimationsAsync(),
    {
      provide: APP_INITIALIZER,
      // in case we add two different configServices, we could extend them. So we also do not have to pass the ConfigType to it
      useFactory: (
        configService: IssuerConfigService,
        httpClient: HttpClient
      ) => configService.appConfigLoader(httpClient),
      deps: [IssuerConfigService, HttpClient],
      multi: true,
    },
    {
      provide: APP_INITIALIZER,
      // in case we add two different configServices, we could extend them. So we also do not have to pass the ConfigType to it
      useFactory: (
        configService: VerifierConfigService,
        httpClient: HttpClient
      ) => configService.appConfigLoader(httpClient),
      deps: [VerifierConfigService, HttpClient],
      multi: true,
    },
    importProvidersFrom(IssuerApiModule, VerifierApiModule),
    {
      provide: IssuerConfiguration,
      deps: [IssuerConfigService],
      useFactory: (configService: IssuerConfigService) => {
        return new IssuerConfiguration({
          basePath: configService.getConfig('backendUrl'),
          credentials: {
            oauth2: () => configService.getToken(),
          },
        });
      },
    },
    {
      provide: VerifierConfiguration,
      deps: [VerifierConfigService],
      useFactory: (configService: VerifierConfigService) => {
        return new VerifierConfiguration({
          basePath: configService.getConfig('backendUrl'),
          credentials: {
            oauth2: () => configService.getToken(),
          },
        });
      },
    },
  ],
};
