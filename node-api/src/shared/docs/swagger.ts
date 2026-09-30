import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Router, type RequestHandler } from 'express';
import swaggerUi from 'swagger-ui-express';
import { parse } from 'yaml';

const SPEC_PATH = fileURLToPath(new URL('../../../api/openapi.yaml', import.meta.url));

/** Serves Swagger UI for `api/openapi.yaml` (the contract-first source of truth). */
export function createDocsRouter(): Router {
  const spec = parse(readFileSync(SPEC_PATH, 'utf8')) as swaggerUi.JsonObject;
  // Swagger UI needs inline scripts/styles that helmet's default CSP blocks.
  const relaxCsp: RequestHandler = (_req, res, next) => {
    res.removeHeader('Content-Security-Policy');
    next();
  };
  return Router().use('/docs', relaxCsp, swaggerUi.serve, swaggerUi.setup(spec));
}
