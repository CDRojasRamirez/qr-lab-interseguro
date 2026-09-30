import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, provideRouter, Router, RouterStateSnapshot } from '@angular/router';
import { authGuard } from './auth.guard';
import { SESSION_KEY } from './auth.service';

describe('authGuard', () => {
  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
  });

  const run = () =>
    TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );
  const store = (expiresAt: number) =>
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ token: 't', expiresAt }));

  it('allows access with a valid session', () => {
    store(Date.now() + 5000);
    expect(run()).toBe(true);
  });

  it('redirects to /login without a session', () => {
    const result = run();
    expect(TestBed.inject(Router).serializeUrl(result as never)).toBe('/login');
  });

  it('redirects when the stored session is expired', () => {
    store(Date.now() - 1);
    expect(run()).not.toBe(true);
  });
});
