/** Canonicalize identifiers such as serial numbers and barcodes for search. */
export function normalizeInventoryIdentifier(value: string | null | undefined): string {
  return (value || '')
    .normalize('NFKC')
    .toLocaleLowerCase('tr-TR')
    .replace(/[^\p{L}\p{N}]/gu, '');
}

export function matchesInventoryIdentifier(value: string | null | undefined, query: string): boolean {
  const normalizedQuery = normalizeInventoryIdentifier(query);
  return Boolean(normalizedQuery && normalizeInventoryIdentifier(value).includes(normalizedQuery));
}
