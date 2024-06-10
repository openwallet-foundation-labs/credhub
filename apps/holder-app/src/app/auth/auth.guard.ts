import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { firstValueFrom, map } from 'rxjs';

export const authGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  return firstValueFrom(
    authService.canActivateProtectedRoutes$.pipe(
      map(async (x) => {
        if (!x) {
          const targetUrl = router.url;
          // we will pass the target URL to the login page
          router.navigateByUrl(`/login?targetUrl=${targetUrl}`);
          return false;
        }
        return true;
      })
    )
  );
};
