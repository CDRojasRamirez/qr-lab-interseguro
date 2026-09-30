import { InvalidMatrixError } from './errors.js';

/** Maximum allowed number of rows and columns. */
export const MAX_DIMENSION = 100;

/** Immutable, validated, named numeric matrix (Value Object). */
export class Matrix {
  private constructor(
    private readonly _name: string,
    private readonly _values: ReadonlyArray<ReadonlyArray<number>>,
  ) {}

  /**
   * Validates and builds a matrix from a defensive deep copy of `values`.
   * @throws InvalidMatrixError on blank name, empty, jagged, oversized or non-finite input.
   */
  static create(name: string, values: ReadonlyArray<ReadonlyArray<number>>): Matrix {
    const trimmed = typeof name === 'string' ? name.trim() : '';
    if (trimmed === '') throw new InvalidMatrixError('Matrix name must not be blank');
    if (!Array.isArray(values) || values.length === 0) {
      throw new InvalidMatrixError(`Matrix "${trimmed}" must have at least one row`);
    }
    const cols = values[0]?.length ?? 0;
    if (cols === 0) {
      throw new InvalidMatrixError(`Matrix "${trimmed}" must have at least one column`);
    }
    if (values.length > MAX_DIMENSION || cols > MAX_DIMENSION) {
      throw new InvalidMatrixError(`Matrix "${trimmed}" exceeds ${MAX_DIMENSION}x${MAX_DIMENSION}`);
    }
    const copy = values.map((row, i) => {
      if (!Array.isArray(row) || row.length !== cols) {
        throw new InvalidMatrixError(`Matrix "${trimmed}" is not rectangular at row ${i}`);
      }
      row.forEach((v, j) => {
        if (typeof v !== 'number' || !Number.isFinite(v)) {
          throw new InvalidMatrixError(`Matrix "${trimmed}" has a non-finite value at [${i}][${j}]`);
        }
      });
      return Object.freeze([...row]);
    });
    return new Matrix(trimmed, Object.freeze(copy));
  }

  /** Trimmed matrix name. */
  get name(): string {
    return this._name;
  }

  /** Number of rows. */
  get rows(): number {
    return this._values.length;
  }

  /** Number of columns. */
  get cols(): number {
    return this._values[0]?.length ?? 0;
  }

  /** Deep-frozen values. */
  get values(): ReadonlyArray<ReadonlyArray<number>> {
    return this._values;
  }

  /** Element at row `i`, column `j` (0-based). */
  at(i: number, j: number): number {
    const v = this._values[i]?.[j];
    if (v === undefined) throw new RangeError(`Index [${i}][${j}] out of bounds`);
    return v;
  }
}
