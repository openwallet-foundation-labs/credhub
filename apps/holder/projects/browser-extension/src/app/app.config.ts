import { type ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { HttpClientModule } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { MAT_DIALOG_DEFAULT_OPTIONS } from '@angular/material/dialog';
import { provideOAuthClient } from 'angular-oauth2-oidc';
import { environment } from '../environments/environment';
import { ApiModule, Configuration } from '../../../shared/api/kms';
import { AuthServiceInterface } from '../../../shared/settings/settings.component';
import { AuthService } from './auth/auth.service';

function getConfiguration() {
  return new Configuration({
    //TODO: the basepath is static, therefore we can not set it during the login process.
    basePath: environment.backendUrl,
    credentials: {
      oauth2: () => {
        return localStorage.getItem('accessToken') as string;
      },
    },
  });
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAnimations(),
    provideOAuthClient(),
    importProvidersFrom(ApiModule, HttpClientModule),
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
