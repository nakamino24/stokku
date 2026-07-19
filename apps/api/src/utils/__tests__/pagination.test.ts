import { parsePagination, paginatedResult } from '../pagination';

describe('parsePagination', () => {
  it('should use defaults for empty query', () => {
    const result = parsePagination({});
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
    expect(result.sortBy).toBe('createdAt');
    expect(result.sortOrder).toBe('desc');
  });

  it('should parse page and limit', () => {
    const result = parsePagination({ page: '3', limit: '50' });
    expect(result.page).toBe(3);
    expect(result.limit).toBe(50);
  });

  it('should cap limit at 100', () => {
    const result = parsePagination({ limit: '500' });
    expect(result.limit).toBe(100);
  });

  it('should enforce minimum page of 1', () => {
    const result = parsePagination({ page: '0' });
    expect(result.page).toBe(1);
  });

  it('should parse sort parameters', () => {
    const result = parsePagination({ sortBy: 'name', sortOrder: 'asc' });
    expect(result.sortBy).toBe('name');
    expect(result.sortOrder).toBe('asc');
  });

  it('should default to desc for invalid sortOrder', () => {
    const result = parsePagination({ sortOrder: 'invalid' });
    expect(result.sortOrder).toBe('desc');
  });
});

describe('paginatedResult', () => {
  const data = [{ id: '1' }, { id: '2' }];

  it('should return paginated shape', () => {
    const result = paginatedResult(data, 50, { page: 2, limit: 10, sortBy: 'createdAt', sortOrder: 'desc' });
    expect(result).toEqual({
      data,
      pagination: {
        page: 2,
        limit: 10,
        total: 50,
        totalPages: 5,
        hasNext: true,
        hasPrev: true,
      },
    });
  });

  it('should indicate no next page on last page', () => {
    const result = paginatedResult(data, 10, { page: 1, limit: 10, sortBy: 'createdAt', sortOrder: 'desc' });
    expect(result.pagination.hasNext).toBe(false);
  });

  it('should indicate no previous page on first page', () => {
    const result = paginatedResult(data, 10, { page: 1, limit: 10, sortBy: 'createdAt', sortOrder: 'desc' });
    expect(result.pagination.hasPrev).toBe(false);
  });

  it('should handle empty data', () => {
    const result = paginatedResult([], 0, { page: 1, limit: 10, sortBy: 'createdAt', sortOrder: 'desc' });
    expect(result.data).toEqual([]);
    expect(result.pagination.total).toBe(0);
    expect(result.pagination.totalPages).toBe(0);
  });
});
