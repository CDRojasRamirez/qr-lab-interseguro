import { Matrix, type AnalysisResult, type MatrixAnalyzer } from '../domain/index.js';
import type { ComputeStatisticsCommand } from './compute-statistics.command.js';
import type { ComputeStatistics } from './ports.js';

/** Builds domain matrices from a command and delegates the analysis. */
export class ComputeStatisticsUseCase implements ComputeStatistics {
  constructor(private readonly analyzer: MatrixAnalyzer) {}

  /** @throws InvalidMatrixError (domain errors propagate unchanged). */
  execute(command: ComputeStatisticsCommand): AnalysisResult {
    const matrices = command.matrices.map((m) => Matrix.create(m.name, m.values));
    return this.analyzer.analyze(matrices);
  }
}
