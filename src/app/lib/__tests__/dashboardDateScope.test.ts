import { describe, expect, it } from 'vitest';
import { getDashboardChartPeriod } from '../dashboardDateScope';

describe('getDashboardChartPeriod', () => {
  it('uses weekly charts for a seven-day selected range', () => {
    expect(getDashboardChartPeriod(new Date(2026, 9, 1), new Date(2026, 9, 7))).toBe('Bu Hafta');
  });

  it('uses weekly charts for a one-day selected range', () => {
    expect(getDashboardChartPeriod(new Date(2026, 9, 7), new Date(2026, 9, 7))).toBe('Bu Hafta');
  });

  it('uses monthly charts for longer or invalid ranges', () => {
    expect(getDashboardChartPeriod(new Date(2026, 9, 1), new Date(2026, 9, 8))).toBe('Bu Ay');
    expect(getDashboardChartPeriod(new Date(NaN), new Date(NaN))).toBe('Bu Ay');
  });
});
