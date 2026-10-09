import { describe, expect, it } from 'vitest';
import { isDateKeyInRange, parseRecallDateRange } from '../recallDateRange';

describe('recall date range', () => {
  it.each([
    ['01.11.2026 - 30.11.2026', { from: '2026-11-01', to: '2026-11-30' }],
    ['01.11.2026 → 30.11.2026', { from: '2026-11-01', to: '2026-11-30' }],
    ['2026-11-01 - 2026-11-30', { from: '2026-11-01', to: '2026-11-30' }],
    ['01/01/2026 - 12/31/2026', { from: '2026-01-01', to: '2026-12-31' }],
  ])('parses %s', (input, expected) => {
    expect(parseRecallDateRange(input)).toEqual(expected);
  });

  it('excludes dates outside the selected period inclusively', () => {
    const range = parseRecallDateRange('01.11.2026 - 30.11.2026');
    expect(isDateKeyInRange('2026-10-29', range)).toBe(false);
    expect(isDateKeyInRange('2026-11-01', range)).toBe(true);
    expect(isDateKeyInRange('2026-11-30', range)).toBe(true);
    expect(isDateKeyInRange('2026-12-01', range)).toBe(false);
  });

  it('correctly filters full year slash range with Turkish formatted and ISO dates', () => {
    const range = parseRecallDateRange('01/01/2026 - 12/31/2026');
    expect(isDateKeyInRange('15.06.2026', range)).toBe(true);
    expect(isDateKeyInRange('2026-10-09T12:00:00Z', range)).toBe(true);
    expect(isDateKeyInRange('31.12.2025', range)).toBe(false);
    expect(isDateKeyInRange('01.01.2027', range)).toBe(false);
  });
});
