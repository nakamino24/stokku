"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paginatedResult = exports.parsePagination = void 0;
function parsePagination(query) {
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';
    return { page, limit, sortBy, sortOrder };
}
exports.parsePagination = parsePagination;
function paginatedResult(data, total, params) {
    const totalPages = Math.ceil(total / params.limit);
    return {
        data,
        pagination: {
            page: params.page,
            limit: params.limit,
            total,
            totalPages,
            hasNext: params.page < totalPages,
            hasPrev: params.page > 1,
        },
    };
}
exports.paginatedResult = paginatedResult;
//# sourceMappingURL=pagination.js.map