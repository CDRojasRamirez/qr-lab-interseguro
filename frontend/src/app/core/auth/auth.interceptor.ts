import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { APP_CONFIG } from '../config/app-config';
import { AuthService } from './auth.service';

/** Attaches the JWT only to our own APIs so it never leaks to third parties. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const { goApiUrl, nodeApiUrl } = inject(APP_CONFIG)();
  const isOwnApi = [goApiUrl, nodeApiUrl]
    .filter(Boolean)
    .some((base) => req.url === base || req.url.startsWith(`${base}/`));
  if (!isOwnApi) {
    return next(req);
  }

  const token = auth.token();
  const outgoing = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;
  const router = inject(Router);
  return next(outgoing).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse && err.status === 401) {
        auth.logout();
        void router.navigate(['/login']);
      }
      return throwError(() => err);
    }),
  );
};
