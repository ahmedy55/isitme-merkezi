import { describe, it, expect } from 'vitest';
import { maskTc } from '../cryptoUtils';

describe('TCKN presentation helpers', () => {
  it('should mask TC identity number correctly for KVKK compliance', () => {
    const rawTc = '12345678901';
    const masked = maskTc(rawTc);
    expect(masked).toBe('123*****901');
  });

});
