import { describe, it, expect } from 'vitest';
import { encryptText, decryptText, maskTc } from '../cryptoUtils';

describe('KVKK Crypto Utilities', () => {
  it('should encrypt plaintext TC identity number with ENC: prefix', () => {
    const rawTc = '12345678901';
    const encrypted = encryptText(rawTc);
    expect(encrypted).toContain('ENC:');
    expect(encrypted).not.toBe(rawTc);
  });

  it('should decrypt encrypted TC identity number back to original plaintext', () => {
    const rawTc = '98765432109';
    const encrypted = encryptText(rawTc);
    const decrypted = decryptText(encrypted);
    expect(decrypted).toBe(rawTc);
  });

  it('should return already encrypted text without double encryption', () => {
    const rawTc = '12345678901';
    const encryptedOnce = encryptText(rawTc);
    const encryptedTwice = encryptText(encryptedOnce);
    expect(encryptedTwice).toBe(encryptedOnce);
  });

  it('should mask TC identity number correctly for KVKK compliance', () => {
    const rawTc = '12345678901';
    const masked = maskTc(rawTc);
    expect(masked).toBe('123*****901');
  });

  it('should mask encrypted TC identity number correctly', () => {
    const rawTc = '98765432109';
    const encrypted = encryptText(rawTc);
    const masked = maskTc(encrypted);
    expect(masked).toBe('987*****109');
  });
});
