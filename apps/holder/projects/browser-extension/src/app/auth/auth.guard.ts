import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = async () => {
  const authService: AuthService = inject(AuthService);
  if (!authService.isAuthenticated()) {
    authService.login();
  }
  return true;
};
