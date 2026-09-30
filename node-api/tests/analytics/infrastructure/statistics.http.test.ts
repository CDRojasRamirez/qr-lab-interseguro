import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';
import type { Express } from 'express';
import { pino } from 'pino';
import { createApp } from '../../../src/app.js';
import { ComputeStatisticsUseCase } from '../../../src/analytics/application/index.js';
import { DiagonalPolicy, StatisticsCalculator } from '../../../src/analytics/domain/index.js';
import { JoseTokenVerifier } from '../../../src/shared/auth/jose-token-verifier.js';
import { AUDIENCE, ISSUER, makeKeys, signToken } from '../../helpers/tokens.js';

const ORIGIN = 'http://localhost:4200';
let app: Express;
let auth: string;

beforeAll(async () => {
  const keys = await makeKeys();
  const tokenVerifier = await JoseTokenVerifier.create({
    publicKeyPem: keys.publicKeyPem,
    issuer: ISSUER,
    audience: AUDIENCE,
  });
  app = createApp({
    logger: pino({ level: 'silent' }),
    computeStatistics: new ComputeStatisticsUseCase(
      new StatisticsCalculator(DiagonalPolicy.create(1e-10)),
    ),
    tokenVerifier,
    allowedOrigins: [ORIGIN],
    bodyLimit: '2kb',
  });
  auth = `Bearer ${await signToken({ key: keys.privateKey })}`;
});

const post = (body?: unknown) => request(app).post('/api/v1/statistics').set('Authorization', auth).send(body as object);

describe('GET /health', () => {
  it('returns 200 ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});

describe('POST /api/v1/statistics', () => {
  it('computes statistics for the Q/R payload', async () => {
    const res = await post({
      matrices: [
        { name: 'Q', values: [[1, 0], [0, 1]] },
        { name: 'R', values: [[2, 1], [0, 3]] },
      ],
    });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      global: { max: 3, min: 0, average: 1, sum: 8, count: 8 },
      perMatrix: [
        { name: 'Q', max: 1, min: 0, average: 0.5, sum: 2, count: 4, isDiagonal: true },
        { name: 'R', max: 3, min: 0, average: 1.5, sum: 6, count: 4, isDiagonal: false },
      ],
      anyDiagonal: true,
    });
  });

  it('answers 401 without a token', async () => {
    const res = await request(app).post('/api/v1/statistics').send({ matrices: [] });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it.each([
    ['missing matrices', {}],
    ['empty matrices', { matrices: [] }],
    ['string values', { matrices: [{ name: 'A', values: [['1', '2']] }] }],
    ['missing name', { matrices: [{ values: [[1]] }] }],
  ])('answers 400 VALIDATION_ERROR on %s', async (_n, body) => {
    const res = await post(body);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details.length).toBeGreaterThan(0);
  });

  it('answers 400 INVALID_MATRIX for a jagged matrix', async () => {
    const res = await post({ matrices: [{ name: 'A', values: [[1, 2], [3]] }] });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_MATRIX');
  });

  it('answers 400 for malformed JSON', async () => {
    const res = await request(app)
      .post('/api/v1/statistics')
      .set('Authorization', auth)
      .set('Content-Type', 'application/json')
      .send('{"matrices":');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('answers 413 when the body exceeds the limit', async () => {
    const res = await post({ matrices: [{ name: 'A'.repeat(3000), values: [[1]] }] });
    expect(res.status).toBe(413);
    expect(res.body.error.code).toBe('PAYLOAD_TOO_LARGE');
  });
});

describe('cross-cutting', () => {
  it('answers unknown routes with a JSON 404', async () => {
    const res = await request(app).get('/nope');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('allows CORS for configured origins only', async () => {
    const ok = await request(app).get('/health').set('Origin', ORIGIN);
    expect(ok.headers['access-control-allow-origin']).toBe(ORIGIN);
    const bad = await request(app).get('/health').set('Origin', 'http://evil.com');
    expect(bad.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('serves Swagger UI at /docs', async () => {
    const res = await request(app).get('/docs/');
    expect(res.status).toBe(200);
    expect(res.text).toContain('swagger');
  });
});
