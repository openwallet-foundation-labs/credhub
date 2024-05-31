import { type ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { MAT_DIALOG_DEFAULT_OPTIONS } from '@angular/material/dialog';
import { provideOAuthClient } from 'angular-oauth2-oidc';
import { environment } from '../environments/environment';
import {
  ApiModule,
  Configuration,
  AuthServiceInterface,
} from '@my-wallet/holder-shared';
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
      //TODO: maybe instead of a factory, we can use a class where we inject a provider to fetch the token.
      provide: Configuration,
      useFactory: (authService: AuthService) =>
        new Configuration({
          //TODO: the basepath is static, therefore we can not set it during the login process.
          basePath: environment.backendUrl,
          credentials: {
            oauth2: authService.getToken.bind(authService),
          },
        }),
      deps: [AuthService],
      multi: false,
    },
  ],
};
