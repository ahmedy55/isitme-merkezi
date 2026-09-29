import { describe, expect, it } from 'vitest';
import { expectedPaymentMonth, monthsUntil } from '../sgkSchedule';

describe('SGK expected payment calendar', () => {
  it('expects January invoices in March', () => {
    expect(expectedPaymentMonth('2026-01')).toBe('2026-03');
  });

  it('crosses the year boundary for November and December invoices', () => {
    expect(expectedPaymentMonth('2026-11')).toBe('2027-01');
    expect(expectedPaymentMonth('2026-12')).toBe('2027-02');
  });

  it('calculates remaining months across years', () => {
    expect(monthsUntil('2027-01', '2026-12')).toBe(1);
  });
});
