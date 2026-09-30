import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Injector, runInInjectionContext } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { APP_CONFIG, APP_CONFIG_ERROR, loadAppConfig } from './app-config';

describe('loadAppConfig', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
  });

  const run = () => runInInjectionContext(TestBed.inject(Injector), () => loadAppConfig());

  it('stores the config and strips trailing slashes', async () => {
    const done = run();
    http
      .expectOne('config.json')
      .flush({ goApiUrl: 'http://go:8080/', nodeApiUrl: 'http://node:3000' });
    await done;
    expect(TestBed.inject(APP_CONFIG)()).toEqual({
      goApiUrl: 'http://go:8080',
      nodeApiUrl: 'http://node:3000',
    });
    expect(TestBed.inject(APP_CONFIG_ERROR)()).toBeNull();
  });

  it('reports a visible error when config.json is missing', async () => {
    const done = run();
    http.expectOne('config.json').flush('nf', { status: 404, statusText: 'Not Found' });
    await done;
    expect(TestBed.inject(APP_CONFIG_ERROR)()).toContain('config.json');
  });

  it('reports an error when the shape is invalid', async () => {
    const done = run();
    http.expectOne('config.json').flush({ goApiUrl: 'http://go' });
    await done;
    expect(TestBed.inject(APP_CONFIG_ERROR)()).toContain('config.json');
  });

  describe('demoCredentials', () => {
    const base = { goApiUrl: 'http://go', nodeApiUrl: 'http://node' };
    const load = async (extra: object) => {
      const done = run();
      http.expectOne('config.json').flush({ ...base, ...extra });
      await done;
      return TestBed.inject(APP_CONFIG)();
    };

    it('keeps demoCredentials when both values are non-empty strings', async () => {
      const cfg = await load({ demoCredentials: { username: 'admin', password: 'secret' } });
      expect(cfg.demoCredentials).toEqual({ username: 'admin', password: 'secret' });
    });

    it.each([
      ['missing', {}],
      ['empty username', { demoCredentials: { username: '', password: 'secret' } }],
      ['empty password', { demoCredentials: { username: 'admin', password: '' } }],
      ['non-string value', { demoCredentials: { username: 'admin', password: 1 } }],
      ['not an object', { demoCredentials: 'admin/secret' }],
    ])('drops demoCredentials when %s', async (_name, extra) => {
      expect((await load(extra)).demoCredentials).toBeUndefined();
      expect(TestBed.inject(APP_CONFIG_ERROR)()).toBeNull();
    });
  });
});
