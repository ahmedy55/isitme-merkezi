import { describe, expect, it } from 'vitest';
import { createTurkishPhoneSearchMatcher, isValidTurkishPhone, normalizeTurkishPhoneInput } from '../turkishPhone';

describe('Turkish phone validation', () => {
  it('accepts a 10-digit national number and an 11-digit number with leading zero', () => {
    expect(isValidTurkishPhone('5321234567')).toBe(true);
    expect(isValidTurkishPhone('05321234567')).toBe(true);
  });

  it('rejects too-short, too-long, and 11-digit numbers without a leading zero', () => {
    expect(isValidTurkishPhone('532123456')).toBe(false);
    expect(isValidTurkishPhone('15321234567')).toBe(false);
    expect(isValidTurkishPhone('053212345678')).toBe(false);
  });

  it('normalizes pasted separators and the +90 country prefix', () => {
    expect(normalizeTurkishPhoneInput('+90 (532) 123 45 67')).toBe('5321234567');
    expect(normalizeTurkishPhoneInput('05 32 123 45 67')).toBe('05321234567');
  });

  it('limits input to 11 digits', () => {
    expect(normalizeTurkishPhoneInput('05551234567890')).toBe('05551234567');
  });

  it('searches stored phone numbers across punctuation and country-code formats without losing zeroes', () => {
    const zeroPrefixedSearch = createTurkishPhoneSearchMatcher('0000000006');
    expect(zeroPrefixedSearch('+90 (000) 000-00-06')).toBe(true);
    expect(zeroPrefixedSearch('000 000 00 06')).toBe(true);
    expect(createTurkishPhoneSearchMatcher('0532-123-45-67')('+90 (532) 123 45 67')).toBe(true);
    expect(createTurkishPhoneSearchMatcher('hasta 0532')('05321234567')).toBe(false);
  });
});
