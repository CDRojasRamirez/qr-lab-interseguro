import { describe, expect, it } from 'vitest';
import { DiagonalPolicy } from '../../../src/analytics/domain/diagonal-policy.js';
import { InvalidPolicyError } from '../../../src/analytics/domain/errors.js';
import { Matrix } from '../../../src/analytics/domain/matrix.js';

const policy = DiagonalPolicy.create(1e-10);
const m = (values: number[][]) => Matrix.create('M', values);

describe('DiagonalPolicy', () => {
  it('accepts the identity', () => {
    expect(policy.isDiagonal(m([[1, 0], [0, 1]]))).toBe(true);
  });

  it('treats a 1x1 matrix as diagonal', () => {
    expect(policy.isDiagonal(m([[7]]))).toBe(true);
  });

  it('accepts a rectangular 3x2 generalized diagonal matrix', () => {
    expect(policy.isDiagonal(m([[3, 0], [0, 2], [0, 0]]))).toBe(true);
  });

  it('accepts a rectangular 2x3 generalized diagonal matrix', () => {
    expect(policy.isDiagonal(m([[3, 0, 0], [0, 2, 0]]))).toBe(true);
  });

  it('tolerates off-diagonal noise below epsilon', () => {
    expect(policy.isDiagonal(m([[1, 1e-17], [0, 1]]))).toBe(true);
  });

  it('rejects off-diagonal values above epsilon', () => {
    expect(policy.isDiagonal(m([[1, 1e-3], [0, 1]]))).toBe(false);
  });

  it('rejects negative off-diagonal values above epsilon', () => {
    expect(policy.isDiagonal(m([[1, 0], [-1e-3, 1]]))).toBe(false);
  });

  it('treats the zero matrix as diagonal', () => {
    expect(policy.isDiagonal(m([[0, 0], [0, 0]]))).toBe(true);
  });

  it('accepts epsilon zero and is then strict', () => {
    const strict = DiagonalPolicy.create(0);
    expect(strict.isDiagonal(m([[1, 0], [0, 1]]))).toBe(true);
    expect(strict.isDiagonal(m([[1, 1e-17], [0, 1]]))).toBe(false);
  });

  it.each([-1, Number.NaN, Infinity])('rejects epsilon %s', (eps) => {
    expect(() => DiagonalPolicy.create(eps)).toThrow(InvalidPolicyError);
  });

  it('uses VALIDATION_ERROR code', () => {
    try {
      DiagonalPolicy.create(-1);
      expect.unreachable();
    } catch (e) {
      expect((e as InvalidPolicyError).code).toBe('VALIDATION_ERROR');
    }
  });
});
