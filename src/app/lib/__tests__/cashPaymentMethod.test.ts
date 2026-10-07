import { describe, expect, it } from 'vitest';
import { inferCashPaymentMethod } from '../cashPaymentMethod';

describe('inferCashPaymentMethod', () => {
  it('reconstructs the payment method from a stored register name', () => {
    expect(inferCashPaymentMethod('Tahsilat Test Hesabı')).toBe('Nakit');
    expect(inferCashPaymentMethod('Banka Hesabı')).toBe('Havale');
    expect(inferCashPaymentMethod('Kredi Kartı POS')).toBe('Kredi Kartı');
  });
});
