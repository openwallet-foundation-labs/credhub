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
import {
  AuthConfig,
  OAuthModuleConfig,
  provideOAuthClient,
} from 'angular-oauth2-oidc';
import { environment } from '../environments/environment';
import { ApiModule, Configuration } from '../../../shared/api/kms';
import { AuthService } from '../../../shared/auth/auth.service';
import { provideServiceWorker } from '@angular/service-worker';

const authConfig: AuthConfig = {
  issuer: `${environment.keycloakHost}/realms/${environment.keycloakRealm}`,
  clientId: environment.keycloakClient, // The "Auth Code + PKCE" client
  responseType: 'code',
  redirectUri: `${window.location.origin}/`,
  silentRefreshRedirectUri: `${window.location.origin}/silent-refresh.html`,
  scope: 'openid', // Ask offline_access to support refresh token refreshes
  useSilentRefresh: true, // Needed for Code Flow to suggest using iframe-based refreshes
  silentRefreshTimeout: 5000, // For faster testing
  timeoutFactor: 0.25, // For faster testing
  sessionChecksEnabled: true,
  showDebugInformation: false, // Also requires enabling "Verbose" level in devtools
  clearHashAfterLogin: false, // https://github.com/manfredsteyer/angular-oauth2-oidc/issues/457#issuecomment-431807040,
  nonceStateSeparator: 'semicolon', // Real semicolon gets mangled by Duende ID Server's URI encoding
};

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
    { provide: AuthConfig, useValue: authConfig },
    { provide: OAuthModuleConfig, useValue: authModuleConfig },
    {
      provide: Configuration,
      useValue: new Configuration({ basePath: environment.backendUrl }),
    },
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
