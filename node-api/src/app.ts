import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import type { Logger } from 'pino';
import { pinoHttp } from 'pino-http';
import type { ComputeStatistics } from './analytics/application/index.js';
import { createStatisticsRoutes } from './analytics/infrastructure/http/statistics.routes.js';
import type { TokenVerifier } from './shared/auth/token-verifier.js';
import { createDocsRouter } from './shared/docs/swagger.js';
import { errorHandler } from './shared/errors/error-handler.js';
import { notFound } from './shared/errors/not-found.js';

export interface AppDeps {
  logger: Logger;
  computeStatistics: ComputeStatistics;
  tokenVerifier: TokenVerifier;
  allowedOrigins: string[];
  bodyLimit: string;
}

/** Builds the Express app (middleware chain, routes, error mapping). */
export function createApp(deps: AppDeps): Express {
  const app = express();
  app.use(helmet());
  app.use(
    cors({
      origin: deps.allowedOrigins,
      allowedHeaders: ['Authorization', 'Content-Type'],
    }),
  );
  app.use(pinoHttp({ logger: deps.logger }));
  app.use(express.json({ limit: deps.bodyLimit }));

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });
  app.use(createDocsRouter());
  app.use(createStatisticsRoutes(deps));

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
