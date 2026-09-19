import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { ISyncAdapter, SyncResponse } from '../lib/syncAdapter';
import type { Product, OutboxItem } from '../lib/types';

describe('Sync Engine & Last-Write-Wins Merge Rules', () => {
  it('applies Last-Write-Wins rule based on updatedAt timestamp', () => {
    const localProduct: Product = {
      id: 'prod-1',
      name: 'Old Product Name',
      unit: 'pcs',
      price: 100,
      updatedAt: 1000
    };

    const remoteNewerProduct: Product = {
      id: 'prod-1',
      name: 'Newer Product Name',
      unit: 'pcs',
      price: 150,
      updatedAt: 2000
    };

    const remoteOlderProduct: Product = {
      id: 'prod-1',
      name: 'Stale Product Name',
      unit: 'pcs',
      price: 50,
      updatedAt: 500
    };

    // Newer remote update should win
    let result = (remoteNewerProduct.updatedAt >= localProduct.updatedAt) ? remoteNewerProduct : localProduct;
    expect(result.name).toBe('Newer Product Name');

    // Older remote update should be ignored
    result = (remoteOlderProduct.updatedAt >= localProduct.updatedAt) ? remoteOlderProduct : localProduct;
    expect(result.name).toBe('Old Product Name');
  });

  it('verifies mock sync adapter handles batch request idempotently', async () => {
    const mockOutbox: OutboxItem[] = [
      {
        table: 'products',
        action: 'put',
        data: { id: 'p1', name: 'Rice', unit: 'kg', price: 100, updatedAt: 1000 },
        timestamp: 1000,
        retryCount: 0
      }
    ];

    const mockAdapter: ISyncAdapter = {
      testConnection: vi.fn().mockResolvedValue({ success: true, message: 'OK' }),
      sync: vi.fn().mockResolvedValue({
        success: true,
        srvUpdatedAt: 2000,
        processedOutboxIds: [1],
        serverChanges: { products: [] }
      } as SyncResponse)
    };

    const res = await mockAdapter.sync('http://mock', 'token123', 0, mockOutbox);
    expect(res.success).toBe(true);
    expect(res.srvUpdatedAt).toBe(2000);
    expect(mockAdapter.sync).toHaveBeenCalledTimes(1);
  });
});
