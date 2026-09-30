import type { AnalysisResult } from './analysis-result.js';
import type { Matrix } from './matrix.js';

/** Abstraction (port) for anything able to analyze a set of matrices. */
export interface MatrixAnalyzer {
  analyze(matrices: readonly Matrix[]): AnalysisResult;
}
