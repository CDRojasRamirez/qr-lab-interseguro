import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { APP_CONFIG } from '../config/app-config';
import { HealthApi, ServiceHealth } from './health.api';

const GO = 'http://go.test';
const NODE = 'http://node.test';

describe('HealthApi', () => {
  let api: HealthApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    TestBed.inject(APP_CONFIG).set({ goApiUrl: GO, nodeApiUrl: NODE });
    api = TestBed.inject(HealthApi);
    http = TestBed.inject(HttpTestingController);
  });

  it('reports both services ok with latency', () => {
    let result: ServiceHealth[] = [];
    api.check().subscribe((r) => (result = r));
    http.expectOne(`${GO}/health`).flush({ status: 'ok' });
    http.expectOne(`${NODE}/health`).flush({ status: 'ok' });

    expect(result.map((s) => [s.name, s.status])).toEqual([
      ['Go API', 'ok'],
      ['Node API', 'ok'],
    ]);
    expect(result.every((s) => typeof s.latencyMs === 'number')).toBe(true);
  });

  it('marks a failing service as down without failing the whole check', () => {
    let result: ServiceHealth[] = [];
    api.check().subscribe((r) => (result = r));
    http.expectOne(`${GO}/health`).flush({ status: 'ok' });
    http.expectOne(`${NODE}/health`).error(new ProgressEvent('error'));

    expect(result[0].status).toBe('ok');
    expect(result[1]).toEqual({ name: 'Node API', status: 'down', latencyMs: null });
  });

  it('marks a non-ok payload as down', () => {
    let result: ServiceHealth[] = [];
    api.check().subscribe((r) => (result = r));
    http.expectOne(`${GO}/health`).flush({ status: 'degraded' });
    http.expectOne(`${NODE}/health`).flush({ status: 'ok' });
    expect(result[0].status).toBe('down');
  });
});
