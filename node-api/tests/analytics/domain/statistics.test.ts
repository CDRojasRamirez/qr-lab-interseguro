import { describe, expect, it } from 'vitest';
import { InvalidMatrixError } from '../../../src/analytics/domain/errors.js';
import { Statistics } from '../../../src/analytics/domain/statistics.js';

describe('Statistics', () => {
  it('handles a single value', () => {
    const s = Statistics.fromValues([4]);
    expect([s.max, s.min, s.average, s.sum, s.count]).toEqual([4, 4, 4, 4, 1]);
  });

  it('handles negatives', () => {
    const s = Statistics.fromValues([-3, -1, -2]);
    expect(s.max).toBe(-1);
    expect(s.min).toBe(-3);
    expect(s.sum).toBe(-6);
    expect(s.average).toBe(-2);
  });

  it('handles mixed values', () => {
    const s = Statistics.fromValues([-5, 0, 5, 10]);
    expect(s.max).toBe(10);
    expect(s.min).toBe(-5);
    expect(s.sum).toBe(10);
    expect(s.count).toBe(4);
    expect(s.average).toBe(2.5);
  });

  it('computes average as sum / count with floats', () => {
    const s = Statistics.fromValues([0.1, 0.2, 0.3]);
    expect(s.average).toBeCloseTo(s.sum / s.count, 12);
    expect(s.average).toBeCloseTo(0.2, 12);
  });

  it('accepts any iterable', () => {
    expect(Statistics.fromValues(new Set([1, 2, 3])).sum).toBe(6);
  });

  it('rejects empty input', () => {
    expect(() => Statistics.fromValues([])).toThrow(InvalidMatrixError);
  });

  it('merge equals fromValues on concatenated data', () => {
    const a = [0.6, -0.8, 0.8, 0.6];
    const b = [5, 1, 0, 2];
    const merged = Statistics.merge([Statistics.fromValues(a), Statistics.fromValues(b)]);
    const whole = Statistics.fromValues([...a, ...b]);
    expect(merged.max).toBe(whole.max);
    expect(merged.min).toBe(whole.min);
    expect(merged.count).toBe(whole.count);
    expect(merged.sum).toBeCloseTo(whole.sum, 12);
    expect(merged.average).toBeCloseTo(whole.average, 12);
  });

  it('merge of one element returns equivalent stats', () => {
    const s = Statistics.fromValues([1, 2]);
    expect(Statistics.merge([s]).toJSON()).toEqual(s.toJSON());
  });

  it('merge rejects an empty list', () => {
    expect(() => Statistics.merge([])).toThrow(InvalidMatrixError);
  });

  it('toJSON returns a plain object', () => {
    expect(Statistics.fromValues([1, 3]).toJSON()).toEqual({
      max: 3,
      min: 1,
      average: 2,
      sum: 4,
      count: 2,
    });
  });
});
