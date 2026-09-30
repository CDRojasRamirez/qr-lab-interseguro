import type { RequestHandler } from 'express';
import type { ComputeStatistics } from '../../application/index.js';
import { toStatisticsResponse } from './statistics.mapper.js';
import { statisticsRequestSchema } from './statistics.schema.js';

/** Validates the body (ZodError / domain errors are rendered by the error handler). */
export function createStatisticsController(computeStatistics: ComputeStatistics): RequestHandler {
  return (req, res) => {
    const command = statisticsRequestSchema.parse(req.body);
    res.json(toStatisticsResponse(computeStatistics.execute(command)));
  };
}
