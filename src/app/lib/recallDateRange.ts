const toDateKey = (value: string): string => {
  const text = value.trim();
  const iso = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (iso) return `${iso[1]}-${iso[2].padStart(2, '0')}-${iso[3].padStart(2, '0')}`;
  const turkish = text.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (turkish) return `${turkish[3]}-${turkish[2].padStart(2, '0')}-${turkish[1].padStart(2, '0')}`;
  return '';
};

/** Parses the date range formats accepted by the recall filter without locale-dependent Date.parse. */
export function parseRecallDateRange(value: string): { from: string; to: string } {
  const parts = value.trim().split(/\s*(?:→|–|—|\s-\s)\s*/);
  return { from: toDateKey(parts[0] || ''), to: toDateKey(parts[1] || '') };
}

export function isDateKeyInRange(value: string, range: { from: string; to: string }): boolean {
  const key = toDateKey(value);
  if (!key) return false;
  return (!range.from || key >= range.from) && (!range.to || key <= range.to);
}
