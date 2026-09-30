import { describe, expect, it } from 'vitest';
import {
  DiagonalPolicy,
  InvalidMatrixError,
  Statistics,
  StatisticsCalculator,
  type AnalysisResult,
  type Matrix,
  type MatrixAnalyzer,
} from '../../../src/analytics/domain/index.js';
import { ComputeStatisticsUseCase } from '../../../src/analytics/application/index.js';

class FakeAnalyzer implements MatrixAnalyzer {
  calls: Array<readonly Matrix[]> = [];
  readonly result: AnalysisResult = Object.freeze({
    global: Statistics.fromValues([1]),
    perMatrix: [],
    anyDiagonal: false,
  });

  analyze(matrices: readonly Matrix[]): AnalysisResult {
    this.calls.push(matrices);
    return this.result;
  }
}

describe('ComputeStatisticsUseCase', () => {
  it('builds matrices in order and returns the analyzer result unchanged', () => {
    const analyzer = new FakeAnalyzer();
    const result = new ComputeStatisticsUseCase(analyzer).execute({
      matrices: [
        { name: ' Q ', values: [[1, 2]] },
        { name: 'R', values: [[3], [4]] },
      ],
    });
    expect(result).toBe(analyzer.result);
    expect(analyzer.calls).toHaveLength(1);
    const built = analyzer.calls[0] ?? [];
    expect(built.map((m) => m.name)).toEqual(['Q', 'R']);
    expect(built.map((m) => m.values)).toEqual([[[1, 2]], [[3], [4]]]);
  });

  it.each([
    ['jagged', { name: 'A', values: [[1, 2], [3]] }],
    ['NaN', { name: 'A', values: [[Number.NaN]] }],
    ['blank name', { name: '   ', values: [[1]] }],
  ])('throws InvalidMatrixError for %s entry without calling the analyzer', (_l, bad) => {
    const analyzer = new FakeAnalyzer();
    const useCase = new ComputeStatisticsUseCase(analyzer);
    expect(() => useCase.execute({ matrices: [{ name: 'ok', values: [[1]] }, bad] })).toThrow(
      InvalidMatrixError,
    );
    expect(analyzer.calls).toHaveLength(0);
  });

  it('computes real statistics with StatisticsCalculator', () => {
    const useCase = new ComputeStatisticsUseCase(
      new StatisticsCalculator(DiagonalPolicy.create(1e-10)),
    );
    const result = useCase.execute({
      matrices: [
        { name: 'Q', values: [[0.6, -0.8], [0.8, 0.6]] },
        { name: 'R', values: [[5, 0], [0, 2]] },
      ],
    });
    expect(result.global.sum).toBeCloseTo(0.6 - 0.8 + 0.8 + 0.6 + 7, 12);
    expect(result.global.count).toBe(8);
    expect(result.anyDiagonal).toBe(true);
    expect(result.perMatrix.map((p) => p.isDiagonal)).toEqual([false, true]);
  });
});
