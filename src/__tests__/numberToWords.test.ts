import { describe, it, expect } from 'vitest';
import { numberToWordsINR } from '../lib/numberToWords';

describe('Indian Numbering Amount In Words Utility', () => {
  it('converts sample amount 10166.00 to exact expected string', () => {
    expect(numberToWordsINR(10166.0)).toBe('Rs. Ten Thousand One Hundred Sixty Six Only');
  });

  it('converts amounts with Lakhs and Crores', () => {
    expect(numberToWordsINR(123456.0)).toBe('Rs. One Lakh Twenty Three Thousand Four Hundred Fifty Six Only');
    expect(numberToWordsINR(10000000.0)).toBe('Rs. One Crore Only');
  });

  it('converts amounts with Paise correctly', () => {
    expect(numberToWordsINR(10166.5)).toBe('Rs. Ten Thousand One Hundred Sixty Six and Fifty Paise Only');
    expect(numberToWordsINR(0.75)).toBe('Rs. Zero and Seventy Five Paise Only');
  });

  it('handles zero gracefully', () => {
    expect(numberToWordsINR(0)).toBe('Rs. Zero Only');
  });
});
