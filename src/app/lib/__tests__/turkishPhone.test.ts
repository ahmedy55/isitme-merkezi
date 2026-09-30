import { describe, expect, it } from 'vitest';
import { isValidTurkishPhone, normalizeTurkishPhoneInput } from '../turkishPhone';

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
});
