import { describe, expect, it } from 'vitest';
import { getRecallCounts, isRecallOverdue, toRecallDateKey } from '../recallStats';

describe('recall metrics', () => {
  it('counts only records present and separates pending, sent, and overdue', () => {
    const recalls = [
      { status: 'Bekliyor', planDate: '2026-10-29' },
      { status: 'Gönderildi', planDate: '2026-10-01' },
      { status: 'Bekliyor', planDate: '2026-09-30' },
      { status: 'Tamamlandı', planDate: '2026-09-29' },
    ];

    expect(getRecallCounts(recalls, '2026-10-02')).toEqual({ total: 4, pending: 1, sent: 1, overdue: 1 });
  });

  it('recognizes overdue records explicitly marked as overdue', () => {
    expect(isRecallOverdue({ status: 'Tarihi Geçti', planDate: '2026-10-20' }, '2026-10-02')).toBe(true);
  });

  it('normalizes Turkish month abbreviations for legacy display dates', () => {
    expect(toRecallDateKey('12 Eyl 2025')).toBe('2025-09-12');
    expect(toRecallDateKey('1 Eki 2026')).toBe('2026-10-01');
  });

  it('does not count an overdue pending reminder as pending', () => {
    expect(getRecallCounts([{ status: 'Bekliyor', planDate: '2026-10-01' }], '2026-10-02'))
      .toEqual({ total: 1, pending: 0, sent: 0, overdue: 1 });
  });
});
