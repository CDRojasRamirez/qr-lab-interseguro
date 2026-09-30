import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { requireAuth } from '../../../src/shared/auth/auth.middleware.js';
import type { TokenVerifier } from '../../../src/shared/auth/token-verifier.js';
import { errorHandler } from '../../../src/shared/errors/error-handler.js';

const verifier: TokenVerifier = {
  verify: async (token) => {
    if (token !== 'good') throw new Error('bad token');
    return { subject: 'bob' };
  },
};

const app = express();
app.get('/p', requireAuth(verifier), (_req, res) => {
  res.json({ subject: res.locals.subject });
});
app.use(errorHandler);

describe('requireAuth', () => {
  it.each([
    ['missing header', undefined],
    ['non-Bearer scheme', 'Basic abc'],
    ['empty Bearer token', 'Bearer '],
    ['invalid token', 'Bearer bad'],
  ])('answers 401 UNAUTHORIZED on %s', async (_name, header) => {
    const req = request(app).get('/p');
    const res = await (header ? req.set('Authorization', header) : req);
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it.each(['bearer good', 'BEARER good', 'Bearer   good'])('accepts scheme case-insensitively: %s', async (header) => {
    const res = await request(app).get('/p').set('Authorization', header);
    expect(res.status).toBe(200);
  });

  it('sets res.locals.subject on success', async () => {
    const res = await request(app).get('/p').set('Authorization', 'Bearer good');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ subject: 'bob' });
  });
});
