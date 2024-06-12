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
  IssuerConfig,
} from '@credhub/issuer-shared';
import {
  Configuration as VerifierConfiguration,
  ApiModule as VerifierApiModule,
  VerifierConfig,
} from '@credhub/verifier-shared';
import { HttpClient, provideHttpClient } from '@angular/common/http';
import { ConfigBasic, ConfigService } from '@credhub/relying-party-frontend';

class Config extends ConfigBasic {
  issuerUrl!: string;
  verifierUrl!: string;
  credentialId!: string;
}

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
        configService: ConfigService<Config>,
        httpClient: HttpClient
      ) => configService.appConfigLoader(httpClient),
      deps: [ConfigService, HttpClient],
      multi: true,
    },
    importProvidersFrom(IssuerApiModule, VerifierApiModule),
    {
      provide: IssuerConfiguration,
      deps: [ConfigService],
      useFactory: (configService: ConfigService<IssuerConfig>) => {
        return new IssuerConfiguration({
          basePath: configService.getConfig('issuerUrl'),
          credentials: {
            oauth2: () => configService.getToken(),
          },
        });
      },
    },
    {
      provide: VerifierConfiguration,
      deps: [ConfigService],
      useFactory: (configService: ConfigService<VerifierConfig>) => {
        return new VerifierConfiguration({
          basePath: configService.getConfig('verifierUrl'),
          credentials: {
            oauth2: () => configService.getToken(),
          },
        });
      },
    },
  ],
};
