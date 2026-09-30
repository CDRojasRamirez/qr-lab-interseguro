import type { Statistics } from './statistics.js';

/** Statistics and diagonality of a single matrix. */
export interface MatrixAnalysis {
  readonly name: string;
  readonly statistics: Statistics;
  readonly isDiagonal: boolean;
}

/** Outcome of analyzing a set of matrices. */
export interface AnalysisResult {
  readonly global: Statistics;
  readonly perMatrix: ReadonlyArray<MatrixAnalysis>;
  readonly anyDiagonal: boolean;
}
