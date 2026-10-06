import { describe, expect, it } from 'vitest';
import { matchesInventoryIdentifier, normalizeInventoryIdentifier } from '../inventorySearch';

describe('inventory identifier search', () => {
  it('matches serials despite different punctuation and whitespace', () => {
    expect(matchesInventoryIdentifier('QA SN 1B 001', 'QA-SN-1B-001')).toBe(true);
    expect(matchesInventoryIdentifier('QA-SN-1B-001', ' qa sn 1b 001 ')).toBe(true);
  });

  it('normalizes Unicode consistently and rejects empty queries', () => {
    expect(normalizeInventoryIdentifier('  İŞİTME-001 ')).toBe('işitme001');
    expect(matchesInventoryIdentifier('QA-SN-1B-001', '---')).toBe(false);
    expect(matchesInventoryIdentifier('QA-SN-1B-001', 'OTHER')).toBe(false);
  });
});
