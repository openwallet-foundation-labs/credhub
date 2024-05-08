import { APP_INITIALIZER, ApplicationConfig } from '@angular/core';
import { HttpClient, provideHttpClient } from '@angular/common/http';
import { ConfigService } from './config/config.service';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(),
    {
      provide: APP_INITIALIZER,
      useFactory: ConfigService.appConfigLoader,
      deps: [ConfigService, HttpClient],
      multi: true,
    },
    provideAnimationsAsync(),
    provideAnimationsAsync(),
  ],
};
