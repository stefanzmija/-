import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { UserRole } from '../models/profile.model';

/** Logged-in users only; others go to /login and come back afterwards. */
export const authGuard: CanActivateFn = async (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  await auth.whenReady();

  return auth.isLoggedIn()
    ? true
    : router.createUrlTree(['/login'], { queryParams: { redirect: state.url } });
};

/** Login/register pages make no sense when already logged in. */
export const guestGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  await auth.whenReady();

  return auth.isLoggedIn() ? router.createUrlTree(['/tickets']) : true;
};

/** Only the given roles may enter. The database enforces the same rules via RLS. */
export function roleGuard(...roles: UserRole[]): CanActivateFn {
  return async (_route, state) => {
    const auth = inject(AuthService);
    const router = inject(Router);
    await auth.whenReady();

    if (!auth.isLoggedIn()) {
      return router.createUrlTree(['/login'], { queryParams: { redirect: state.url } });
    }
    const role = auth.role();
    return role && roles.includes(role) ? true : router.createUrlTree(['/tickets']);
  };
}
