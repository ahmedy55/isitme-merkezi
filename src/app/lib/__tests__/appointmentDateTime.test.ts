import { describe, expect, it } from 'vitest';
import { parseAppointmentDateTime } from '../appointmentDateTime';

describe('parseAppointmentDateTime', () => {
  it('parses Postgres TIME values with seconds', () => {
    const result = parseAppointmentDateTime('2026-10-01', '08:00:00');
    expect(result).not.toBeNull();
    expect(result?.getFullYear()).toBe(2026);
    expect(result?.getMonth()).toBe(9);
    expect(result?.getDate()).toBe(1);
    expect(result?.getHours()).toBe(8);
    expect(result?.getMinutes()).toBe(0);
  });

  it('accepts date-time strings and ignores seconds for the picker', () => {
    const result = parseAppointmentDateTime('2026-10-01T00:00:00.000Z', '14:35:59');
    expect(result?.getHours()).toBe(14);
    expect(result?.getMinutes()).toBe(35);
  });

  it.each([
    ['', '08:00:00'],
    ['2026-02-30', '08:00:00'],
    ['2026-10-01', '25:00:00'],
    ['2026-10-01', 'not-a-time'],
  ])('returns null for invalid date/time values (%s, %s)', (date, time) => {
    expect(parseAppointmentDateTime(date, time)).toBeNull();
  });
});
