import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { AuthService } from './auth.service';

// eslint-disable-next-line @typescript-eslint/no-namespace
export declare namespace globalThis {
  let token: string;
}

export const authGuard: CanActivateFn = async () => {
  const authService: AuthService = inject(AuthService);
  return authService
    .isAuthenticated()
    .then(async () => {
      globalThis.token = await authService.getToken();
      return true;
    })
    .catch(() => {
      authService.login();
      return false;
    });
};
