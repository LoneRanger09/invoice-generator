import { describe, it, expect } from 'vitest';
import {
  toPaise,
  fromPaise,
  calculateLineAmountPaise,
  calculateRoundOffPaise,
  formatINR,
  formatNumberIN
} from '../lib/money';

describe('Money Utilities (Integer Paise Arithmetic)', () => {
  it('converts rupees to paise accurately', () => {
    expect(toPaise(120.0)).toBe(12000);
    expect(toPaise(28.0)).toBe(2800);
    expect(toPaise(6.62)).toBe(662);
    expect(toPaise(0.3)).toBe(30);
  });

  it('converts paise to rupees accurately', () => {
    expect(fromPaise(12000)).toBe(120.0);
    expect(fromPaise(105920)).toBe(1059.2);
  });

  it('calculates line amount in paise for decimal quantities', () => {
    // 17.60 kgs * 120.00 rate = 2112.00 rupees -> 211200 paise
    expect(calculateLineAmountPaise(17.6, 120.0)).toBe(211200);

    // 44.00 kgs * 28.00 rate = 1232.00 rupees -> 123200 paise
    expect(calculateLineAmountPaise(44.0, 28.0)).toBe(123200);

    // 6.62 kgs * 160.00 rate = 1059.20 rupees -> 105920 paise
    expect(calculateLineAmountPaise(6.62, 160.0)).toBe(105920);
  });

  it('calculates round-off to nearest rupee correctly', () => {
    // Subtotal = 10165.70 rupees -> 1016570 paise
    // Nearest rupee total = 10166.00 rupees -> 1016600 paise
    // Round off = +30 paise (+0.30 rupees)
    const res1 = calculateRoundOffPaise(1016570, true);
    expect(res1.roundOffPaise).toBe(30);
    expect(res1.totalPaise).toBe(1016600);

    // Subtotal = 10166.40 rupees -> 1016640 paise
    // Round off = -40 paise (-0.40 rupees)
    const res2 = calculateRoundOffPaise(1016640, true);
    expect(res2.roundOffPaise).toBe(-40);
    expect(res2.totalPaise).toBe(1016600);

    // Round off disabled
    const resDisabled = calculateRoundOffPaise(1016570, false);
    expect(resDisabled.roundOffPaise).toBe(0);
    expect(resDisabled.totalPaise).toBe(1016570);
  });

  it('formats currency in Indian numbering standard', () => {
    expect(formatINR(10166)).toBe('₹10,166.00');
    expect(formatINR(123456.5)).toBe('₹1,23,456.50');
    expect(formatNumberIN(10166.3)).toBe('10,166.30');
  });
});
