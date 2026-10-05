import { describe, expect, it, vi } from 'vitest';
import { executeDbQuery, fetchAllPages } from '../database';

describe('executeDbQuery', () => {
  it('surfaces actionable database validation errors instead of a generic query message', async () => {
    await expect(executeDbQuery(async () => { throw new Error('Stock item category is invalid'); }, 'dbInsertStockItem'))
      .rejects.toThrow('Stock item category is invalid');
  });
});

describe('fetchAllPages', () => {
  it('reads every row using bounded inclusive ranges', async () => {
    const rows = Array.from({ length: 1102 }, (_, id) => ({ id }));
    const ranges: [number, number][] = [];
    const fetchPage = vi.fn(async (from: number, to: number) => ({
      data: rows.slice(from, to + 1), error: null,
    }));

    const result = await fetchAllPages((from, to) => {
      ranges.push([from, to]);
      return fetchPage(from, to);
    });

    expect(result).toHaveLength(1102);
    expect(result[1101]).toEqual({ id: 1101 });
    expect(ranges).toEqual([[0, 499], [500, 999], [1000, 1499]]);
  });

  it('propagates page errors instead of returning partial results', async () => {
    await expect(fetchAllPages(async () => ({ data: null, error: new Error('offline') })))
      .rejects.toThrow('offline');
  });

  it('rejects invalid page sizes', async () => {
    await expect(fetchAllPages(async () => ({ data: [], error: null }), 0))
      .rejects.toThrow(RangeError);
  });
});
