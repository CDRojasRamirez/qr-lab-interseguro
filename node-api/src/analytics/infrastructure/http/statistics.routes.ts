import { Router } from 'express';
import type { TokenVerifier } from '../../../shared/auth/token-verifier.js';
import { requireAuth } from '../../../shared/auth/auth.middleware.js';
import type { ComputeStatistics } from '../../application/index.js';
import { createStatisticsController } from './statistics.controller.js';

export interface StatisticsRoutesDeps {
  computeStatistics: ComputeStatistics;
  tokenVerifier: TokenVerifier;
}

/** Router for the analytics context, mounted at the app root. */
export function createStatisticsRoutes(deps: StatisticsRoutesDeps): Router {
  const router = Router();
  router.post(
    '/api/v1/statistics',
    requireAuth(deps.tokenVerifier),
    createStatisticsController(deps.computeStatistics),
  );
  return router;
}
