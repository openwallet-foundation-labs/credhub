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
} from '@my-wallet/-holder-shared';
import { AuthService } from './auth/auth.service';
import { HashLocationStrategy, LocationStrategy } from '@angular/common';

// eslint-disable-next-line @typescript-eslint/no-namespace
export declare namespace globalThis {
  let token: string;
}

function getConfiguration() {
  return new Configuration({
    //TODO: the basepath is static, therefore we can not set it during the login process.
    basePath: environment.backendUrl,
    credentials: {
      // we fetch the token via globalThis since we can not access it via the chrome.storage API since it's async.
      oauth2: () => globalThis.token,
    },
  });
}

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
      provide: Configuration,
      useFactory: getConfiguration,
    },
  ],
};
