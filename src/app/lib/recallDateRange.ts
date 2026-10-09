export const toDateKey = (value: string): string => {
  const text = (value || '').trim();
  if (!text) return '';

  // ISO date with optional time: YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss
  const iso = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) return `${iso[1]}-${iso[2].padStart(2, '0')}-${iso[3].padStart(2, '0')}`;

  // Turkish dot format: DD.MM.YYYY
  const turkish = text.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (turkish) return `${turkish[3]}-${turkish[2].padStart(2, '0')}-${turkish[1].padStart(2, '0')}`;

  // Slash format with year first: YYYY/MM/DD
  const slashIso = text.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})/);
  if (slashIso) return `${slashIso[1]}-${slashIso[2].padStart(2, '0')}-${slashIso[3].padStart(2, '0')}`;

  // Slash format: MM/DD/YYYY or DD/MM/YYYY
  const slash = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (slash) {
    const p1 = Number(slash[1]);
    const p2 = Number(slash[2]);
    const year = slash[3];
    // If p1 > 12, it must be DD/MM/YYYY
    if (p1 > 12) {
      return `${year}-${String(p2).padStart(2, '0')}-${String(p1).padStart(2, '0')}`;
    }
    // If p2 > 12, it must be MM/DD/YYYY
    if (p2 > 12) {
      return `${year}-${String(p1).padStart(2, '0')}-${String(p2).padStart(2, '0')}`;
    }
    // Default slash date to MM/DD/YYYY (standard in browser/picker date ranges like 01/01/2026 - 12/31/2026)
    return `${year}-${String(p1).padStart(2, '0')}-${String(p2).padStart(2, '0')}`;
  }

  return '';
};

/** Parses the date range formats accepted by the recall & SGK filters without locale-dependent Date.parse. */
export function parseRecallDateRange(value: string): { from: string; to: string } {
  const parts = (value || '').trim().split(/\s*(?:→|–|—)\s*|\s+-\s+/);
  return { from: toDateKey(parts[0] || ''), to: toDateKey(parts[1] || '') };
}

export function isDateKeyInRange(value: string, range: { from: string; to: string }): boolean {
  const key = toDateKey(value);
  if (!key) return false;
  return (!range.from || key >= range.from) && (!range.to || key <= range.to);
}
