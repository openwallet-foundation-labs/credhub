import {
  APP_INITIALIZER,
  ApplicationConfig,
  importProvidersFrom,
} from '@angular/core';
import { HttpClient, provideHttpClient } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import {
  ApiModule,
  VerifierConfig,
  Configuration,
} from '@credhub/verifier-shared';
import { ConfigService } from '@credhub/relying-party-frontend';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(),
    {
      provide: APP_INITIALIZER,
      useFactory: (
        configService: ConfigService<VerifierConfig>,
        httpClient: HttpClient
      ) => configService.appConfigLoader(httpClient),
      deps: [ConfigService, HttpClient],
      multi: true,
    },
    provideAnimationsAsync(),
    provideAnimationsAsync(),
    importProvidersFrom(ApiModule),
    {
      provide: Configuration,
      deps: [ConfigService],
      useFactory: (configService: ConfigService<VerifierConfig>) => {
        return new Configuration({
          basePath: configService.getConfig<string>('backendUrl'),
          credentials: {
            oauth2: () => configService.getToken(),
          },
        });
      },
    },
  ],
};
