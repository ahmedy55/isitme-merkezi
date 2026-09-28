/**
 * Presentation-only helpers. TCKN encryption/decryption is performed by the
 * database using a key stored in Supabase Vault, never in browser JavaScript.
 */
export function maskTc(tc?: string | null): string {
  if (!tc || typeof tc !== 'string') return '';
  const cleanTc = tc.trim();
  if (cleanTc.length < 11) return cleanTc;
  return `${cleanTc.substring(0, 3)}*****${cleanTc.substring(8)}`;
}
