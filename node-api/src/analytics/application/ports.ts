import type { AnalysisResult } from '../domain/index.js';
import type { ComputeStatisticsCommand } from './compute-statistics.command.js';

/** Input port: computes statistics for a set of named matrices. */
export interface ComputeStatistics {
  execute(command: ComputeStatisticsCommand): AnalysisResult;
}
