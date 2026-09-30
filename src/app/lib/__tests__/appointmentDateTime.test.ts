import { describe, expect, it } from 'vitest';
import { validateAppointmentDateTime } from '../validation';

describe('appointment date and time validation', () => {
  const now = new Date(2026, 8, 30, 14, 30, 0);

  it('rejects an appointment on a past day', () => {
    expect(validateAppointmentDateTime('2026-09-29', '16:00', now).isValid).toBe(false);
  });

  it('rejects an earlier time today and the current minute', () => {
    expect(validateAppointmentDateTime('2026-09-30', '14:00', now).isValid).toBe(false);
    expect(validateAppointmentDateTime('2026-09-30', '14:30', now).isValid).toBe(false);
  });

  it('accepts a future time today and a future date', () => {
    expect(validateAppointmentDateTime('2026-09-30', '14:31', now).isValid).toBe(true);
    expect(validateAppointmentDateTime('2026-10-01', '09:00', now).isValid).toBe(true);
  });

  it('rejects missing or invalid date-time values', () => {
    expect(validateAppointmentDateTime('', '09:00', now).isValid).toBe(false);
    expect(validateAppointmentDateTime('not-a-date', '09:00', now).isValid).toBe(false);
  });
});
