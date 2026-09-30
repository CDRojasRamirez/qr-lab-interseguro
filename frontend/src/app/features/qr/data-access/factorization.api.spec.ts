import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { APP_CONFIG } from '../../../core/config/app-config';
import { ApiError } from '../../../core/http/api-error';
import { FactorizationApi } from './factorization.api';
import { FactorizationResponse } from './factorization.models';

const GO = 'http://go.test';

const response: FactorizationResponse = {
  q: [[1, 0], [0, 1]],
  r: [[2, 1], [0, 3]],
  statistics: {
    global: { max: 3, min: 0, average: 1, sum: 8, count: 8 },
    perMatrix: [
      { name: 'Q', max: 1, min: 0, average: 0.5, sum: 2, count: 4, isDiagonal: true },
      { name: 'R', max: 3, min: 0, average: 1.5, sum: 6, count: 4, isDiagonal: false },
    ],
    anyDiagonal: true,
  },
};

describe('FactorizationApi', () => {
  let api: FactorizationApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    TestBed.inject(APP_CONFIG).set({ goApiUrl: GO, nodeApiUrl: 'http://node.test' });
    api = TestBed.inject(FactorizationApi);
    http = TestBed.inject(HttpTestingController);
  });

  it('POSTs the matrix and returns the typed response', () => {
    let result: FactorizationResponse | undefined;
    api.factorize([[1, 2], [3, 4]]).subscribe((r) => (result = r));
    const req = http.expectOne(`${GO}/api/v1/factorizations`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ matrix: [[1, 2], [3, 4]] });
    req.flush(response);
    expect(result).toEqual(response);
  });

  it('maps failures to ApiError', () => {
    let error: ApiError | undefined;
    api.factorize([[1]]).subscribe({ error: (e) => (error = e) });
    http
      .expectOne(`${GO}/api/v1/factorizations`)
      .flush(
        { error: { code: 'UPSTREAM_TIMEOUT', message: 'slow', details: [] } },
        { status: 504, statusText: 'x' },
      );
    expect(error?.code).toBe('UPSTREAM_TIMEOUT');
    expect(error?.status).toBe(504);
  });
});
