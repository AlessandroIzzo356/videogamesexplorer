import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';

export const authGuard: CanMatchFn = () => {
  const auth = inject(Auth);
  const router = inject(Router);

  return new Promise<boolean | ReturnType<Router['parseUrl']>>(resolve => {
    const unsubscribe = onAuthStateChanged(
      auth,
      user => {
        unsubscribe();
        resolve(user ? true : router.parseUrl('/login'));
      },
      () => {
        unsubscribe();
        resolve(router.parseUrl('/login'));
      }
    );
  });
};
