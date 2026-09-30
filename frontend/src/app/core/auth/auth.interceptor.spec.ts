import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { APP_CONFIG } from '../config/app-config';
import { authInterceptor } from './auth.interceptor';
import { AuthService, SESSION_KEY } from './auth.service';

const GO = 'http://go.test';
const NODE = 'http://node.test';

describe('authInterceptor', () => {
  let http: HttpClient;
  let ctrl: HttpTestingController;
  let navigate: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    sessionStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ token: 'jwt', expiresAt: Date.now() + 9e5 }),
    );
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    TestBed.inject(APP_CONFIG).set({ goApiUrl: GO, nodeApiUrl: NODE });
    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    http = TestBed.inject(HttpClient);
    ctrl = TestBed.inject(HttpTestingController);
  });

  afterEach(() => sessionStorage.clear());

  it.each([`${GO}/api/v1/factorizations`, `${NODE}/health`])('adds Bearer to %s', (url) => {
    http.get(url).subscribe();
    const req = ctrl.expectOne(url);
    expect(req.request.headers.get('Authorization')).toBe('Bearer jwt');
    req.flush({});
  });

  it('does not leak the token to other origins', () => {
    for (const url of ['https://other.com/x', `${GO}.evil.com/x`]) {
      http.get(url).subscribe();
      const req = ctrl.expectOne(url);
      expect(req.request.headers.has('Authorization')).toBe(false);
      req.flush({});
    }
  });

  it('skips the header when there is no token', () => {
    TestBed.inject(AuthService).logout();
    http.get(`${GO}/health`).subscribe();
    const req = ctrl.expectOne(`${GO}/health`);
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('logs out and redirects to /login on 401 from our APIs', () => {
    http.get(`${GO}/api/v1/factorizations`).subscribe({ error: () => undefined });
    ctrl.expectOne(`${GO}/api/v1/factorizations`).flush({}, { status: 401, statusText: 'x' });
    expect(TestBed.inject(AuthService).isAuthenticated()).toBe(false);
    expect(navigate).toHaveBeenCalledWith(['/login']);
  });

  it('ignores 401 from foreign origins', () => {
    http.get('https://other.com/x').subscribe({ error: () => undefined });
    ctrl.expectOne('https://other.com/x').flush({}, { status: 401, statusText: 'x' });
    expect(TestBed.inject(AuthService).isAuthenticated()).toBe(true);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('propagates non-401 errors untouched', () => {
    let status = 0;
    http.get(`${GO}/x`).subscribe({ error: (e) => (status = e.status) });
    ctrl.expectOne(`${GO}/x`).flush({}, { status: 500, statusText: 'x' });
    expect(status).toBe(500);
    expect(navigate).not.toHaveBeenCalled();
  });
});
