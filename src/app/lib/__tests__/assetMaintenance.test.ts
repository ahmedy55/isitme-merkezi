import { describe, expect, it } from 'vitest';
import { getNextMaintenanceDate } from '../assetMaintenance';

describe('getNextMaintenanceDate', () => {
  it('returns null when maintenance history is missing or invalid', () => {
    expect(getNextMaintenanceDate('', 12)).toBeNull();
    expect(getNextMaintenanceDate('not-a-date', 12)).toBeNull();
    expect(getNextMaintenanceDate('2025-01-01', 0)).toBeNull();
  });

  it('adds the maintenance interval to a valid date', () => {
    expect(getNextMaintenanceDate('2025-01-15', 12)?.toISOString()).toBe('2026-01-15T00:00:00.000Z');
  });
});
