import { describe, expect, it } from 'vitest';
import { filterAppointmentsForDay } from '../appointmentFilters';

describe('filterAppointmentsForDay', () => {
  it('keeps only appointments for the selected calendar date', () => {
    const appointments = [
      { id: 'same-day', date: '2026-10-02' },
      { id: 'previous-day', date: '2026-10-01' },
      { id: 'next-day', date: '2026-10-03' },
    ];

    expect(filterAppointmentsForDay(appointments, '2026-10-02')).toEqual([appointments[0]]);
  });

  it('returns an empty list when the selected day has no appointments', () => {
    expect(filterAppointmentsForDay([{ id: 'other-day', date: '2026-10-01' }], '2026-10-02')).toEqual([]);
  });
});
