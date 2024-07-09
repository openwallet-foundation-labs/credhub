import {
  type ApplicationConfig,
  importProvidersFrom,
  APP_INITIALIZER,
  isDevMode,
  ErrorHandler,
} from '@angular/core';
import { Router, provideRouter } from '@angular/router';

import { routes } from './app.routes';
import {
  HttpClient,
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { MAT_DIALOG_DEFAULT_OPTIONS } from '@angular/material/dialog';
import { OAuthModuleConfig, provideOAuthClient } from 'angular-oauth2-oidc';
import {
  ApiModule,
  Configuration,
  AuthServiceInterface,
} from '@credhub/holder-shared';
import { AuthService } from './auth/auth.service';
import { provideServiceWorker } from '@angular/service-worker';
import { ConfigService } from './config.service';
import * as Sentry from '@sentry/angular';
import { environment } from '../environments/environment';

Sentry.init({
  dsn: environment.sentryDsn,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  // Performance Monitoring
  tracesSampleRate: 1.0, //  Capture 100% of the transactions
  // Set 'tracePropagationTargets' to control for which URLs distributed tracing should be enabled
  tracePropagationTargets: ['localhost', /^https:\/\/backend\.credhub\.eu/],
  // Session Replay
  replaysSessionSampleRate: 0.1, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
  replaysOnErrorSampleRate: 1.0, // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
});

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAnimations(),
    provideOAuthClient(),
    provideHttpClient(withInterceptorsFromDi()),
    importProvidersFrom(ApiModule),
    { provide: MAT_DIALOG_DEFAULT_OPTIONS, useValue: { hasBackdrop: true } },
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
          authService.init();
          await authService.runInitialLoginSequence();
        },
      deps: [AuthService, ConfigService, HttpClient, Sentry.TraceService],
      multi: true,
    },
    {
      provide: OAuthModuleConfig,
      useFactory: (configService: ConfigService) => {
        return {
          resourceServer: {
            sendAccessToken: true,
            customUrlValidation: (url: string) => {
              // we need to ignore calls to assets to fetch the config file
              if (url.startsWith('/assets')) return true;
              return url.startsWith(configService.getConfig('backendUrl'));
            },
          },
        };
      },
      deps: [ConfigService],
      multi: false,
    },
    {
      provide: Configuration,
      useFactory: (configService: ConfigService, authService: AuthService) =>
        new Configuration({
          basePath: configService.getConfig('backendUrl'),
          credentials: {
            oauth2: () => authService.accessToken,
          },
        }),
      deps: [ConfigService, AuthService],
      multi: false,
    },
    {
      provide: AuthServiceInterface,
      useClass: AuthService,
    },
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
    {
      provide: ErrorHandler,
      useValue: Sentry.createErrorHandler({
        showDialog: true,
      }),
    },
    {
      provide: Sentry.TraceService,
      deps: [Router],
    },
  ],
};
