import type { RequestHandler } from 'express';
import { HttpError } from './http-error.js';

/** Fallback handler: forwards a 404 HttpError to the error middleware. */
export const notFound: RequestHandler = (req, _res, next) => {
  next(new HttpError(404, 'NOT_FOUND', `Route ${req.method} ${req.path} not found`));
};
