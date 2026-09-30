import { describe, expect, it } from 'vitest';
import { DiagonalPolicy } from '../../../src/analytics/domain/diagonal-policy.js';
import { InvalidMatrixError } from '../../../src/analytics/domain/errors.js';
import { Matrix } from '../../../src/analytics/domain/matrix.js';
import { StatisticsCalculator } from '../../../src/analytics/domain/statistics-calculator.js';

const calculator = new StatisticsCalculator(DiagonalPolicy.create(1e-10));
const Q = Matrix.create('Q', [[0.6, -0.8], [0.8, 0.6]]);
const R = Matrix.create('R', [[5, 1], [0, 2]]);

describe('StatisticsCalculator', () => {
  it('computes global and per-matrix statistics for Q/R', () => {
    const result = calculator.analyze([Q, R]);
    expect(result.global.max).toBe(5);
    expect(result.global.min).toBe(-0.8);
    expect(result.global.count).toBe(8);
    expect(result.global.sum).toBeCloseTo(9.2, 12);
    expect(result.global.average).toBeCloseTo(1.15, 12);

    expect(result.perMatrix.map((p) => p.name)).toEqual(['Q', 'R']);
    const [q, r] = result.perMatrix;
    expect(q!.statistics.sum).toBeCloseTo(1.2, 12);
    expect(q!.statistics.max).toBe(0.8);
    expect(r!.statistics.sum).toBe(8);
    expect(r!.statistics.average).toBe(2);
    expect(q!.isDiagonal).toBe(false);
    expect(r!.isDiagonal).toBe(false);
    expect(result.anyDiagonal).toBe(false);
  });

  it('flags anyDiagonal when an identity matrix is present', () => {
    const identity = Matrix.create('I', [[1, 0], [0, 1]]);
    const result = calculator.analyze([Q, identity]);
    expect(result.anyDiagonal).toBe(true);
    expect(result.perMatrix[1]!.isDiagonal).toBe(true);
    expect(result.perMatrix[0]!.isDiagonal).toBe(false);
  });

  it('throws on an empty list', () => {
    expect(() => calculator.analyze([])).toThrow(InvalidMatrixError);
  });

  it('throws on duplicate names', () => {
    const dup = Matrix.create('Q', [[1]]);
    expect(() => calculator.analyze([Q, dup])).toThrow(InvalidMatrixError);
  });

  it('returns a frozen perMatrix list', () => {
    expect(Object.isFrozen(calculator.analyze([Q]).perMatrix)).toBe(true);
  });
});
