import {
  APP_INITIALIZER,
  ApplicationConfig,
  importProvidersFrom,
} from '@angular/core';
import { HttpClient, provideHttpClient } from '@angular/common/http';
import { ConfigService } from './config/config.service';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { ApiModule, Configuration } from '@credhub/verifier-shared';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(),
    {
      provide: APP_INITIALIZER,
      useFactory: ConfigService.appConfigLoader,
      deps: [ConfigService, HttpClient],
      multi: true,
    },
    provideAnimationsAsync(),
    provideAnimationsAsync(),
    importProvidersFrom(ApiModule),
    {
      provide: Configuration,
      deps: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return new Configuration({
          basePath: configService.getConfig('verifierUrl'),
          credentials: {
            oauth2: () => configService.getToken(),
          },
        });
      },
    },
  ],
};
