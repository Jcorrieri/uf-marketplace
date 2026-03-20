import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = async () => {
  const router = inject(Router);

  try {
    const res = await fetch('/api/users/me', { credentials: 'include' });
    if (res.ok) {
      return true;
    }
  } catch {
    // network error — treat as unauthenticated
  }

  return router.createUrlTree(['/login']);
};
