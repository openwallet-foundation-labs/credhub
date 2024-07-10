import {
  APP_INITIALIZER,
  type ApplicationConfig,
  importProvidersFrom,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { HttpClient, provideHttpClient } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { MAT_DIALOG_DEFAULT_OPTIONS } from '@angular/material/dialog';
import { provideOAuthClient } from 'angular-oauth2-oidc';
import {
  ApiModule,
  Configuration,
  AuthServiceInterface,
  ConfigService,
} from '@credhub/holder-shared';
import { AuthService } from './auth/auth.service';
import { HashLocationStrategy, LocationStrategy } from '@angular/common';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    { provide: LocationStrategy, useClass: HashLocationStrategy },
    provideAnimations(),
    provideHttpClient(),
    provideOAuthClient(),
    importProvidersFrom(ApiModule),
    { provide: MAT_DIALOG_DEFAULT_OPTIONS, useValue: { hasBackdrop: true } },
    {
      provide: AuthServiceInterface,
      useClass: AuthService,
    },
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
          //authService.init();
          //await authService.runInitialLoginSequence();
        },
      deps: [AuthService, ConfigService, HttpClient],
      multi: true,
    },
    {
      provide: Configuration,
      useFactory: (authService: AuthService, configService: ConfigService) =>
        new Configuration({
          basePath: configService.getConfig('backendUrl'),
          credentials: {
            oauth2: authService.getToken.bind(authService),
          },
        }),
      deps: [AuthService, ConfigService],
      multi: false,
    },
  ],
};
