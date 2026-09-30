import { HttpErrorResponse } from '@angular/common/http';
import { toApiError } from './api-error';

const httpError = (status: number, body: unknown) =>
  new HttpErrorResponse({ status, error: body, url: 'http://x/api' });

describe('toApiError', () => {
  it('maps status 0 to NETWORK_ERROR', () => {
    const err = toApiError(httpError(0, new ProgressEvent('error')));
    expect(err.status).toBe(0);
    expect(err.code).toBe('NETWORK_ERROR');
    expect(err.message).toContain('conectar');
  });

  it('reads code and details from the contract body', () => {
    const err = toApiError(
      httpError(400, { error: { code: 'INVALID_MATRIX', message: 'rows', details: ['row 2'] } }),
    );
    expect(err).toEqual({
      status: 400,
      code: 'INVALID_MATRIX',
      message: 'La matriz no es válida.',
      details: ['row 2'],
    });
  });

  it.each([
    ['UNAUTHORIZED', 401],
    ['PAYLOAD_TOO_LARGE', 413],
    ['UPSTREAM_UNAVAILABLE', 502],
    ['UPSTREAM_TIMEOUT', 504],
    ['UPSTREAM_REJECTED', 502],
    ['INTERNAL_ERROR', 500],
    ['VALIDATION_ERROR', 400],
    ['NOT_FOUND', 404],
  ])('has a Spanish message for %s', (code, status) => {
    const err = toApiError(httpError(status, { error: { code, message: 'm', details: [] } }));
    expect(err.code).toBe(code);
    expect(err.message).not.toBe('m');
    expect(err.message.length).toBeGreaterThan(5);
  });

  it('falls back to the status when the body is not the contract', () => {
    expect(toApiError(httpError(401, 'nope')).code).toBe('UNAUTHORIZED');
    expect(toApiError(httpError(504, null)).code).toBe('UPSTREAM_TIMEOUT');
    expect(toApiError(httpError(418, '<html>')).code).toBe('INTERNAL_ERROR');
  });

  it('uses the server message for unknown codes', () => {
    const err = toApiError(httpError(400, { error: { code: 'WEIRD', message: 'custom' } }));
    expect(err.message).toBe('custom');
    expect(err.details).toEqual([]);
  });

  it('handles non-http errors', () => {
    const err = toApiError(new Error('boom'));
    expect(err.code).toBe('INTERNAL_ERROR');
    expect(err.status).toBe(0);
  });
});
