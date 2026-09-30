import type { AnalysisResult, MatrixAnalysis } from './analysis-result.js';
import type { DiagonalPolicy } from './diagonal-policy.js';
import { InvalidMatrixError } from './errors.js';
import type { MatrixAnalyzer } from './matrix-analyzer.js';
import type { Matrix } from './matrix.js';
import { Statistics } from './statistics.js';

/** Domain service: computes per-matrix and global statistics. */
export class StatisticsCalculator implements MatrixAnalyzer {
  constructor(private readonly diagonalPolicy: DiagonalPolicy) {}

  /**
   * Scans each matrix once and merges the partial statistics for the global figure.
   * @throws InvalidMatrixError if the list is empty or names are duplicated.
   */
  analyze(matrices: readonly Matrix[]): AnalysisResult {
    if (matrices.length === 0) {
      throw new InvalidMatrixError('At least one matrix is required');
    }
    const seen = new Set<string>();
    for (const m of matrices) {
      if (seen.has(m.name)) {
        throw new InvalidMatrixError(`Duplicate matrix name "${m.name}"`);
      }
      seen.add(m.name);
    }
    const perMatrix = matrices.map(
      (m): MatrixAnalysis =>
        Object.freeze({
          name: m.name,
          statistics: Statistics.fromValues(m.values.flat()),
          isDiagonal: this.diagonalPolicy.isDiagonal(m),
        }),
    );
    return Object.freeze({
      global: Statistics.merge(perMatrix.map((p) => p.statistics)),
      perMatrix: Object.freeze(perMatrix),
      anyDiagonal: perMatrix.some((p) => p.isDiagonal),
    });
  }
}
