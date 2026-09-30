import { describe, expect, it } from 'vitest';
import { InvalidMatrixError } from '../../../src/analytics/domain/errors.js';
import { Matrix, MAX_DIMENSION } from '../../../src/analytics/domain/matrix.js';

describe('Matrix', () => {
  it('creates a valid matrix', () => {
    const m = Matrix.create('Q', [[1, 2, 3], [4, 5, 6]]);
    expect(m.name).toBe('Q');
    expect(m.rows).toBe(2);
    expect(m.cols).toBe(3);
    expect(m.at(1, 2)).toBe(6);
    expect(m.values).toEqual([[1, 2, 3], [4, 5, 6]]);
  });

  it('trims the name', () => {
    expect(Matrix.create('  R ', [[1]]).name).toBe('R');
  });

  it.each([
    ['empty matrix', [] as number[][]],
    ['empty row', [[]]],
    ['jagged rows', [[1, 2], [3]]],
    ['NaN', [[1, Number.NaN]]],
    ['Infinity', [[Infinity]]],
    ['-Infinity', [[-Infinity]]],
  ])('rejects %s', (_label, values) => {
    expect(() => Matrix.create('A', values)).toThrow(InvalidMatrixError);
  });

  it('rejects more than MAX_DIMENSION rows', () => {
    const values = Array.from({ length: MAX_DIMENSION + 1 }, () => [1]);
    expect(() => Matrix.create('A', values)).toThrow(InvalidMatrixError);
  });

  it('rejects more than MAX_DIMENSION cols', () => {
    const values = [Array.from({ length: MAX_DIMENSION + 1 }, () => 1)];
    expect(() => Matrix.create('A', values)).toThrow(InvalidMatrixError);
  });

  it('accepts exactly MAX_DIMENSION', () => {
    const values = Array.from({ length: MAX_DIMENSION }, () =>
      Array.from({ length: MAX_DIMENSION }, () => 0),
    );
    expect(Matrix.create('A', values).rows).toBe(MAX_DIMENSION);
  });

  it.each(['', '   '])('rejects blank name %j', (name) => {
    expect(() => Matrix.create(name, [[1]])).toThrow(InvalidMatrixError);
  });

  it('exposes the INVALID_MATRIX code', () => {
    try {
      Matrix.create('', [[1]]);
      expect.unreachable();
    } catch (e) {
      expect((e as InvalidMatrixError).code).toBe('INVALID_MATRIX');
    }
  });

  it('is unaffected by mutation of the input after creation', () => {
    const input = [[1, 2], [3, 4]];
    const m = Matrix.create('A', input);
    input[0]![0] = 99;
    expect(m.at(0, 0)).toBe(1);
  });

  it('returns frozen values', () => {
    const m = Matrix.create('A', [[1, 2]]);
    expect(Object.isFrozen(m.values)).toBe(true);
    expect(Object.isFrozen(m.values[0])).toBe(true);
    expect(() => {
      (m.values[0] as number[])[0] = 5;
    }).toThrow(TypeError);
  });
});
