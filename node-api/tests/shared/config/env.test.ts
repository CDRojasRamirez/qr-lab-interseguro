import { describe, expect, it } from 'vitest';
import { loadEnv } from '../../../src/shared/config/env.js';

const PEM = '-----BEGIN PUBLIC KEY-----\nABC\n-----END PUBLIC KEY-----';

describe('loadEnv', () => {
  it('applies defaults', () => {
    const env = loadEnv({ JWT_PUBLIC_KEY: PEM });
    expect(env).toMatchObject({
      PORT: 3000,
      JWT_ISSUER: 'qr-go-api',
      JWT_AUDIENCE: 'qr-challenge',
      BODY_LIMIT: '512kb',
      DIAGONAL_EPSILON: 1e-10,
    });
    expect(env.ALLOWED_ORIGINS).toEqual(['http://localhost:4200', 'http://localhost:8080']);
  });

  it('turns literal \n escapes of an inline PEM into newlines', () => {
    const env = loadEnv({ JWT_PUBLIC_KEY: PEM.replaceAll('\n', '\n') });
    expect(env.JWT_PUBLIC_KEY).toBe(PEM);
  });

  it('reads the key from JWT_PUBLIC_KEY_PATH', () => {
    const env = loadEnv({ JWT_PUBLIC_KEY_PATH: '/k.pem' }, (p) => (p === '/k.pem' ? PEM : ''));
    expect(env.JWT_PUBLIC_KEY).toBe(PEM);
  });

  it('fails when no key source is provided', () => {
    expect(() => loadEnv({})).toThrow(/JWT_PUBLIC_KEY/);
  });

  it('parses and trims the ALLOWED_ORIGINS list', () => {
    const env = loadEnv({ JWT_PUBLIC_KEY: PEM, ALLOWED_ORIGINS: 'http://a.com, http://b.com ,' });
    expect(env.ALLOWED_ORIGINS).toEqual(['http://a.com', 'http://b.com']);
  });
});
