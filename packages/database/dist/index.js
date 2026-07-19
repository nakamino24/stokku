"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaClient = exports.prisma = void 0;
const client_1 = require("@prisma/client");
function buildConnectionUrl() {
    const base = process.env.DATABASE_URL;
    if (!base)
        return undefined;
    // Neon (and most serverless Postgres) benefit from a bounded pool.
    // Append pooling parameters so each serverless invocation reuses the
    // connection pooler instead of opening a fresh TCP connection.
    try {
        const url = new URL(base);
        const params = url.searchParams;
        if (!params.has('connection_limit'))
            params.set('connection_limit', '5');
        if (!params.has('pool_timeout'))
            params.set('pool_timeout', '20');
        if (!params.has('sslmode'))
            params.set('sslmode', 'require');
        return url.toString();
    }
    catch {
        return base;
    }
}
function createPrismaClient() {
    const isServerless = !!process.env.VERCEL;
    const connectionUrl = buildConnectionUrl();
    if (!connectionUrl) {
        throw new Error('DATABASE_URL environment variable is not set');
    }
    return new client_1.PrismaClient({
        log: !isServerless && process.env.NODE_ENV === 'development'
            ? ['query', 'warn', 'error']
            : ['error'],
        datasources: {
            db: { url: connectionUrl },
        },
    });
}
exports.prisma = global.prisma ||
    createPrismaClient();
if (process.env.NODE_ENV !== 'production') {
    global.prisma = exports.prisma;
}
var client_2 = require("@prisma/client");
Object.defineProperty(exports, "PrismaClient", { enumerable: true, get: function () { return client_2.PrismaClient; } });
//# sourceMappingURL=index.js.map