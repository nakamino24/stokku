export interface PaginationParams {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
export interface PaginatedResult<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}
export declare function parsePagination(query: Record<string, any>): Required<PaginationParams>;
export declare function paginatedResult<T>(data: T[], total: number, params: Required<PaginationParams>): PaginatedResult<T>;
//# sourceMappingURL=pagination.d.ts.map