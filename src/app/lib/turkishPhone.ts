/** Normalize user-entered Turkish phone numbers to digits in national format. */
export function normalizeTurkishPhoneInput(value: string): string {
  let digits = value.replace(/\D/g, '');
  if (digits.startsWith('0090')) digits = digits.slice(4);
  else if (digits.startsWith('90') && digits.length > 10) digits = digits.slice(2);
  return digits.slice(0, 11);
}

function phoneSearchVariants(value: string): string[] {
  let digits = value.replace(/\D/g, '');
  if (!digits) return [];
  if (digits.startsWith('0090') && digits.length > 10) digits = digits.slice(4);
  else if (digits.startsWith('90') && digits.length > 10) digits = digits.slice(2);

  const variants = new Set([digits]);
  if (digits.length === 11 && digits.startsWith('0')) variants.add(digits.slice(1));
  else if (digits.length === 10) variants.add(`0${digits}`);
  return [...variants];
}

/** Build one normalized matcher per search instead of reparsing the query per patient. */
export function createTurkishPhoneSearchMatcher(query: string): (phone: string | null | undefined) => boolean {
  const queryDigits = query.replace(/\D/g, '');
  // Avoid interpreting arbitrary text searches as phone-number searches.
  if (!queryDigits || /[^\d\s+().\-/]/.test(query)) return () => false;

  const queryVariants = phoneSearchVariants(query);
  return phone => phoneSearchVariants(phone || '').some(
    stored => queryVariants.some(candidate => stored.includes(candidate))
  );
}

/** Accept 10-digit national numbers or the same number with a leading 0. */
export function isValidTurkishPhone(value: string): boolean {
  const digits = value.replace(/\D/g, '');
  return digits.length === 10 || (digits.length === 11 && digits.startsWith('0'));
}
