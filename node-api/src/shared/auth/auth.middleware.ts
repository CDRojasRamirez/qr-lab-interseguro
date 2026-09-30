import type { RequestHandler } from 'express';
import { HttpError } from '../errors/http-error.js';
import type { TokenVerifier } from './token-verifier.js';

const BEARER = /^Bearer\s+(\S+)$/i; // RFC 7235: auth scheme is case-insensitive

const unauthorized = (): HttpError =>
  new HttpError(401, 'UNAUTHORIZED', 'Missing, invalid or expired token');

/** Middleware factory: requires a valid Bearer token and exposes `res.locals.subject`. */
export function requireAuth(verifier: TokenVerifier): RequestHandler {
  return async (req, res, next) => {
    const token = BEARER.exec(req.headers.authorization ?? '')?.[1];
    if (!token) return next(unauthorized());
    try {
      res.locals.subject = (await verifier.verify(token)).subject;
      next();
    } catch {
      next(unauthorized());
    }
  };
}
