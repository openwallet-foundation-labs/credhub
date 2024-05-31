import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { AuthService } from './auth.service';
import { SettingsService } from '@my-wallet/holder-shared';

export const authGuard: CanActivateFn = async () => {
  const authService: AuthService = inject(AuthService);
  const settingsService = inject(SettingsService);
  return authService
    .isAuthenticated()
    .then(async () => {
      await authService.setToken();
      //set the theme here. We can not do this in the app.component because it gets loaded before the login process is finished.
      settingsService.setThemeToApplication();
      return true;
    })
    .catch(() => {
      authService.login();
      return false;
    });
};
