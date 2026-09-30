import { InvalidPolicyError } from './errors.js';
import type { Matrix } from './matrix.js';

/**
 * Decides whether a matrix is diagonal within a numeric tolerance.
 *
 * Design decision: rectangular matrices ARE allowed and are evaluated as
 * generalized diagonal matrices (like Sigma in an SVD): only entries with
 * i != j must be (approximately) zero. A 1x1 matrix is trivially diagonal.
 */
export class DiagonalPolicy {
  private constructor(private readonly epsilon: number) {}

  /** @param epsilon finite tolerance >= 0 injected by the caller (no magic numbers). */
  static create(epsilon: number): DiagonalPolicy {
    if (typeof epsilon !== 'number' || !Number.isFinite(epsilon) || epsilon < 0) {
      throw new InvalidPolicyError('epsilon must be a finite number >= 0');
    }
    return new DiagonalPolicy(epsilon);
  }

  /** True iff every off-diagonal entry satisfies |x| <= epsilon. */
  isDiagonal(matrix: Matrix): boolean {
    for (let i = 0; i < matrix.rows; i++) {
      for (let j = 0; j < matrix.cols; j++) {
        if (i !== j && Math.abs(matrix.at(i, j)) > this.epsilon) return false;
      }
    }
    return true;
  }
}
