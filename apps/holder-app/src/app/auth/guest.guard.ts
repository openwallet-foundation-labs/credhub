import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { firstValueFrom, map } from 'rxjs';

export const guestGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  return firstValueFrom(
    authService.canActivateProtectedRoutes$.pipe(
      map((x) => {
        //when the person is authenticated, they will be redirected to the home page
        if (x) {
          router.navigateByUrl('/');
          return false;
        }
        return true;
      })
    )
  );
};
