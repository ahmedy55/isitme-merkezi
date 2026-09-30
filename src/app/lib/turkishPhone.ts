/** Normalize user-entered Turkish phone numbers to digits in national format. */
export function normalizeTurkishPhoneInput(value: string): string {
  let digits = value.replace(/\D/g, '');
  if (digits.startsWith('0090')) digits = digits.slice(4);
  else if (digits.startsWith('90') && digits.length > 10) digits = digits.slice(2);
  return digits.slice(0, 11);
}

/** Accept 10-digit national numbers or the same number with a leading 0. */
export function isValidTurkishPhone(value: string): boolean {
  const digits = value.replace(/\D/g, '');
  return digits.length === 10 || (digits.length === 11 && digits.startsWith('0'));
}
