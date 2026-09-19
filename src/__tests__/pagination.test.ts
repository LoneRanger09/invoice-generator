import { describe, it, expect } from 'vitest';

export function paginateInvoiceItems<T>(items: T[], itemsPerPage = 25): T[][] {
  const pages: T[][] = [];
  for (let i = 0; i < items.length; i += itemsPerPage) {
    pages.push(items.slice(i, i + itemsPerPage));
  }
  return pages;
}

describe('Invoice Multipage Pagination Logic', () => {
  it('correctly splits 65 items across multiple pages with headers repeating', () => {
    const sampleItems = Array.from({ length: 65 }, (_, i) => ({
      slNo: i + 1,
      description: `Item #${i + 1}`,
      qty: 1,
      unit: 'pcs',
      rate: 10,
      amount: 10
    }));

    const pages = paginateInvoiceItems(sampleItems, 25);
    expect(pages.length).toBe(3);
    expect(pages[0].length).toBe(25);
    expect(pages[1].length).toBe(25);
    expect(pages[2].length).toBe(15);
  });
});
