import {
  type ApplicationConfig,
  importProvidersFrom,
  APP_INITIALIZER,
  isDevMode,
} from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { HttpClientModule } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { MAT_DIALOG_DEFAULT_OPTIONS } from '@angular/material/dialog';
import { OAuthModuleConfig, provideOAuthClient } from 'angular-oauth2-oidc';
import { environment } from '../environments/environment';
import {
  ApiModule,
  Configuration,
  AuthServiceInterface,
} from '@my-wallet/-holder-shared';
import { AuthService } from './auth/auth.service';
import { provideServiceWorker } from '@angular/service-worker';

function authAppInitializerFactory(
  authService: AuthService
): () => Promise<void> {
  return () => authService.runInitialLoginSequence();
}

const authModuleConfig: OAuthModuleConfig = {
  resourceServer: {
    allowedUrls: [environment.backendUrl],
    sendAccessToken: true,
  },
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAnimations(),
    provideOAuthClient(),
    importProvidersFrom(ApiModule, HttpClientModule),
    { provide: MAT_DIALOG_DEFAULT_OPTIONS, useValue: { hasBackdrop: true } },
    {
      provide: APP_INITIALIZER,
      useFactory: authAppInitializerFactory,
      deps: [AuthService],
      multi: true,
    },
    { provide: OAuthModuleConfig, useValue: authModuleConfig },
    {
      provide: Configuration,
      useValue: new Configuration({ basePath: environment.backendUrl }),
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
