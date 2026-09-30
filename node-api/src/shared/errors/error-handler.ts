import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { DomainError } from '../domain/index.js';
import { HttpError } from './http-error.js';

interface Rendered {
  status: number;
  code: string;
  message: string;
  details?: string[];
}

function bodyParserType(err: unknown): string | undefined {
  return typeof err === 'object' && err !== null && 'type' in err ? String(err.type) : undefined;
}

/** Translates any thrown value into the public error shape (no internals leaked). */
function render(err: unknown): Rendered | undefined {
  if (err instanceof HttpError) return err;
  if (err instanceof DomainError) return { status: 400, code: err.code, message: err.message, details: err.details };
  if (err instanceof ZodError) {
    const details = err.issues.map((i) => `${i.path.join('.') || '(body)'}: ${i.message}`);
    return { status: 400, code: 'VALIDATION_ERROR', message: 'Invalid request body', details };
  }
  const type = bodyParserType(err);
  if (type === 'entity.too.large') {
    return { status: 413, code: 'PAYLOAD_TOO_LARGE', message: 'Request body exceeds the size limit' };
  }
  if (type === 'entity.parse.failed') {
    return { status: 400, code: 'VALIDATION_ERROR', message: 'Malformed JSON body' };
  }
  return undefined;
}

/** Express error middleware rendering `{ error: { code, message, details } }`. */
export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (res.headersSent) return next(err);
  const known = render(err);
  if (!known) req.log?.error({ err }, 'unhandled error');
  const { status, code, message, details } = known ?? {
    status: 500,
    code: 'INTERNAL_ERROR',
    message: 'Internal server error',
  };
  res.status(status).json({ error: { code, message, details: details ?? [] } });
};
