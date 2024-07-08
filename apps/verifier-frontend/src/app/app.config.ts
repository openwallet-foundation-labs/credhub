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
  VerifierConfigService,
} from '@credhub/verifier-shared';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(),
    {
      provide: APP_INITIALIZER,
      useFactory: (
        configService: VerifierConfigService,
        httpClient: HttpClient
      ) => configService.appConfigLoader(httpClient, 'assets/config.json'),
      deps: [VerifierConfigService, HttpClient],
      multi: true,
    },
    provideAnimationsAsync(),
    provideAnimationsAsync(),
    importProvidersFrom(ApiModule),
    {
      provide: Configuration,
      deps: [VerifierConfigService],
      useFactory: (configService: VerifierConfigService) => {
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
