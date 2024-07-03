import {
  APP_INITIALIZER,
  ApplicationConfig,
  importProvidersFrom,
} from '@angular/core';
import { HttpClient, provideHttpClient } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { ApiModule, IssuerConfig, Configuration } from '@credhub/issuer-shared';
import { ConfigService } from '@credhub/relying-party-frontend';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(),
    {
      provide: APP_INITIALIZER,
      useFactory: (
        configService: ConfigService<IssuerConfig>,
        httpClient: HttpClient
      ) => configService.appConfigLoader(httpClient),
      deps: [ConfigService, HttpClient],
      multi: true,
    },
    provideAnimationsAsync(),
    importProvidersFrom(ApiModule),
    {
      provide: Configuration,
      deps: [ConfigService],
      useFactory: (configService: ConfigService<IssuerConfig>) => {
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
