import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { APP_CONFIG } from '../config/app-config';
import { ApiError } from '../http/api-error';
import { AuthService, SESSION_KEY } from './auth.service';

const GO = 'http://go.test';
const store = (expiresAt: number) =>
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({ token: 't', expiresAt }));

describe('AuthService', () => {
  let http: HttpTestingController;

  const setup = () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    TestBed.inject(APP_CONFIG).set({ goApiUrl: GO, nodeApiUrl: 'http://node.test' });
    http = TestBed.inject(HttpTestingController);
    return TestBed.inject(AuthService);
  };

  beforeEach(() => sessionStorage.clear());

  it('starts logged out', () => {
    const auth = setup();
    expect(auth.isAuthenticated()).toBe(false);
    expect(auth.token()).toBeNull();
  });

  it('logs in, exposes the token and persists it with its expiry', () => {
    const auth = setup();
    let completed = false;
    auth.login('admin', 'secret').subscribe({ complete: () => (completed = true) });
    const req = http.expectOne(`${GO}/api/v1/auth/login`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ username: 'admin', password: 'secret' });
    req.flush({ accessToken: 'jwt', tokenType: 'Bearer', expiresIn: 900 });

    expect(completed).toBe(true);
    expect(auth.token()).toBe('jwt');
    expect(auth.isAuthenticated()).toBe(true);
    const saved = JSON.parse(sessionStorage.getItem(SESSION_KEY)!);
    expect(saved.token).toBe('jwt');
    expect(saved.expiresAt).toBeGreaterThan(Date.now());
  });

  it('maps login failures to ApiError', () => {
    const auth = setup();
    let error: ApiError | undefined;
    auth.login('a', 'b').subscribe({ error: (e) => (error = e) });
    http
      .expectOne(`${GO}/api/v1/auth/login`)
      .flush({ error: { code: 'UNAUTHORIZED', message: 'bad' } }, { status: 401, statusText: 'x' });
    expect(error?.code).toBe('UNAUTHORIZED');
    expect(auth.isAuthenticated()).toBe(false);
  });

  it('logout clears state and storage', () => {
    store(Date.now() + 5000);
    const auth = setup();
    expect(auth.isAuthenticated()).toBe(true);
    auth.logout();
    expect(auth.isAuthenticated()).toBe(false);
    expect(sessionStorage.getItem(SESSION_KEY)).toBeNull();
  });

  it('treats an expired stored token as logged out', () => {
    store(Date.now() - 1);
    const auth = setup();
    expect(auth.isAuthenticated()).toBe(false);
    expect(sessionStorage.getItem(SESSION_KEY)).toBeNull();
  });

  it('hasValidSession drops a session that expired while the app was open', () => {
    store(Date.now() + 1000);
    const auth = setup();
    expect(auth.hasValidSession()).toBe(true);
    vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 2000);
    try {
      expect(auth.hasValidSession()).toBe(false);
      expect(auth.isAuthenticated()).toBe(false);
    } finally {
      vi.restoreAllMocks();
    }
  });

  it('ignores corrupt storage', () => {
    sessionStorage.setItem(SESSION_KEY, '{not json');
    expect(setup().isAuthenticated()).toBe(false);
  });
});
