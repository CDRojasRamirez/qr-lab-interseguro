import express, { type Request, type Response } from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { InvalidMatrixError } from '../../../src/analytics/domain/index.js';
import { DomainError } from '../../../src/shared/domain/index.js';
import { errorHandler } from '../../../src/shared/errors/error-handler.js';
import { HttpError } from '../../../src/shared/errors/http-error.js';
import { notFound } from '../../../src/shared/errors/not-found.js';

function appThrowing(err: unknown) {
  const app = express();
  app.get('/boom', () => {
    throw err;
  });
  app.get('/json', express.json({ limit: '10b' }), (_req: Request, res: Response) => res.end());
  app.post('/json', express.json({ limit: '10b' }), (_req: Request, res: Response) => res.end());
  app.use(notFound);
  app.use(errorHandler);
  return app;
}

describe('errorHandler', () => {
  it('renders HttpError as-is', async () => {
    const res = await request(appThrowing(new HttpError(401, 'UNAUTHORIZED', 'nope', ['x']))).get('/boom');
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: { code: 'UNAUTHORIZED', message: 'nope', details: ['x'] } });
  });

  it('maps DomainError to 400 with its code and details', async () => {
    const err = new InvalidMatrixError('bad', ['d1']);
    expect(err).toBeInstanceOf(DomainError);
    const res = await request(appThrowing(err)).get('/boom');
    expect(res.status).toBe(400);
    expect(res.body.error).toEqual({ code: 'INVALID_MATRIX', message: 'bad', details: ['d1'] });
  });

  it('maps ZodError to 400 VALIDATION_ERROR with path: message details', async () => {
    const parsed = z.object({ a: z.number() }).safeParse({ a: 'x' });
    const res = await request(appThrowing(parsed.error)).get('/boom');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details[0]).toMatch(/^a: /);
  });

  it('maps oversized bodies to 413 PAYLOAD_TOO_LARGE', async () => {
    const res = await request(appThrowing(new Error('x'))).post('/json').send({ big: 'x'.repeat(50) });
    expect(res.status).toBe(413);
    expect(res.body.error.code).toBe('PAYLOAD_TOO_LARGE');
  });

  it('maps malformed JSON to 400 VALIDATION_ERROR', async () => {
    const res = await request(appThrowing(new Error('x')))
      .post('/json')
      .set('Content-Type', 'application/json')
      .send('{bad');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('hides unknown errors behind a generic 500', async () => {
    const res = await request(appThrowing(new Error('secret db password'))).get('/boom');
    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe('INTERNAL_ERROR');
    expect(JSON.stringify(res.body)).not.toContain('secret');
  });

  it('answers unknown routes with a JSON 404', async () => {
    const res = await request(appThrowing(new Error('x'))).get('/nope');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});
