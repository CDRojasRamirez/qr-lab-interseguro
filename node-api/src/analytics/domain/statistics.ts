import { InvalidMatrixError } from './errors.js';

/** Plain serializable shape of {@link Statistics}. */
export interface StatisticsSnapshot {
  max: number;
  min: number;
  average: number;
  sum: number;
  count: number;
}

/** Immutable aggregate statistics (Value Object). */
export class Statistics {
  private constructor(
    readonly max: number,
    readonly min: number,
    readonly sum: number,
    readonly count: number,
  ) {
    Object.freeze(this);
  }

  /** Mean, always derived as sum / count. */
  get average(): number {
    return this.sum / this.count;
  }

  /** Computes statistics in a single pass. @throws InvalidMatrixError if `values` is empty. */
  static fromValues(values: Iterable<number>): Statistics {
    let max = -Infinity;
    let min = Infinity;
    let sum = 0;
    let count = 0;
    for (const v of values) {
      if (v > max) max = v;
      if (v < min) min = v;
      sum += v;
      count++;
    }
    if (count === 0) throw new InvalidMatrixError('Statistics require at least one value');
    return new Statistics(max, min, sum, count);
  }

  /** Combines statistics without re-scanning values. @throws InvalidMatrixError if `stats` is empty. */
  static merge(stats: readonly Statistics[]): Statistics {
    if (stats.length === 0) throw new InvalidMatrixError('Cannot merge an empty list of statistics');
    let max = -Infinity;
    let min = Infinity;
    let sum = 0;
    let count = 0;
    for (const s of stats) {
      max = Math.max(max, s.max);
      min = Math.min(min, s.min);
      sum += s.sum;
      count += s.count;
    }
    return new Statistics(max, min, sum, count);
  }

  /** Plain object for JSON serialization. */
  toJSON(): StatisticsSnapshot {
    return {
      max: this.max,
      min: this.min,
      average: this.average,
      sum: this.sum,
      count: this.count,
    };
  }
}
