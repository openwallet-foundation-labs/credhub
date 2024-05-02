import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { AuthService } from './auth.service';
import { firstValueFrom, tap } from 'rxjs';

export const authGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  return firstValueFrom(
    authService.canActivateProtectedRoutes$.pipe(
      tap((x) => {
        if (!x) {
          authService.login();
        }
      })
    )
  );
};
