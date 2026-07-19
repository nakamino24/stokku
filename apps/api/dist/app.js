"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const security_1 = require("./middleware/security");
const requestId_1 = require("./middleware/requestId");
const errorHandler_1 = require("./middleware/errorHandler");
const database_1 = require("@stokku/database");
const logger_1 = require("./utils/logger");
const config_1 = require("./config");
const auth_routes_1 = __importDefault(require("./modules/auth/auth.routes"));
const dashboard_routes_1 = __importDefault(require("./modules/dashboard/dashboard.routes"));
const products_routes_1 = __importDefault(require("./modules/products/products.routes"));
const categories_routes_1 = __importDefault(require("./modules/categories/categories.routes"));
const suppliers_routes_1 = __importDefault(require("./modules/suppliers/suppliers.routes"));
const customers_routes_1 = __importDefault(require("./modules/customers/customers.routes"));
const warehouses_routes_1 = __importDefault(require("./modules/warehouses/warehouses.routes"));
const stock_routes_1 = __importDefault(require("./modules/stock/stock.routes"));
const purchase_orders_routes_1 = __importDefault(require("./modules/purchase-orders/purchase-orders.routes"));
const sales_orders_routes_1 = __importDefault(require("./modules/sales-orders/sales-orders.routes"));
const reports_routes_1 = __importDefault(require("./modules/reports/reports.routes"));
const users_routes_1 = __importDefault(require("./modules/users/users.routes"));
const roles_routes_1 = __importDefault(require("./modules/roles/roles.routes"));
const settings_routes_1 = __importDefault(require("./modules/settings/settings.routes"));
let configValidated = false;
function validateConfig() {
    if (configValidated)
        return;
    const errors = [];
    if (!config_1.config.jwt.accessSecret || config_1.config.jwt.accessSecret.length < 16) {
        errors.push('ACCESS_TOKEN_SECRET must be at least 16 characters');
    }
    if (!config_1.config.jwt.refreshSecret || config_1.config.jwt.refreshSecret.length < 16) {
        errors.push('REFRESH_TOKEN_SECRET must be at least 16 characters');
    }
    configValidated = true;
    if (errors.length > 0) {
        logger_1.logger.error('Configuration validation failed', { errors });
        throw new Error(`Configuration errors:\n${errors.join('\n')}`);
    }
}
const app = (0, express_1.default)();
// Vercel terminates TLS and forwards client IP via X-Forwarded-For.
// Trust the platform proxy so express-rate-limit can identify clients
// correctly (prevents ERR_ERL_UNEXPECTED_X_FORWARDED_FOR).
app.set('trust proxy', 1);
app.use((_req, _res, next) => {
    try {
        validateConfig();
        next();
    }
    catch (err) {
        next(err);
    }
});
app.use(security_1.securityMiddleware);
app.use(security_1.corsMiddleware);
app.use(requestId_1.requestIdMiddleware);
app.use(express_1.default.json({ limit: '1mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cookie_parser_1.default)());
app.use((req, _res, next) => {
    const requestId = req.headers['x-request-id'];
    logger_1.logger.info(`${req.method} ${req.path}`, { requestId, ip: req.ip });
    next();
});
app.get('/health', async (_req, res) => {
    try {
        await database_1.prisma.$queryRaw `SELECT 1`;
        res.status(200).json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            database: 'connected',
            uptime: process.uptime(),
        });
    }
    catch {
        res.status(503).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            database: 'disconnected',
        });
    }
});
app.use('/api/v1/auth', security_1.authLimiter, auth_routes_1.default);
app.use('/api/v1/dashboard', security_1.apiLimiter, dashboard_routes_1.default);
app.use('/api/v1/products', security_1.apiLimiter, products_routes_1.default);
app.use('/api/v1/categories', security_1.apiLimiter, categories_routes_1.default);
app.use('/api/v1/suppliers', security_1.apiLimiter, suppliers_routes_1.default);
app.use('/api/v1/customers', security_1.apiLimiter, customers_routes_1.default);
app.use('/api/v1/warehouses', security_1.apiLimiter, warehouses_routes_1.default);
app.use('/api/v1/stock', security_1.apiLimiter, stock_routes_1.default);
app.use('/api/v1/purchase-orders', security_1.apiLimiter, purchase_orders_routes_1.default);
app.use('/api/v1/sales-orders', security_1.apiLimiter, sales_orders_routes_1.default);
app.use('/api/v1/reports', security_1.apiLimiter, reports_routes_1.default);
app.use('/api/v1/users', security_1.apiLimiter, users_routes_1.default);
app.use('/api/v1/roles', security_1.apiLimiter, roles_routes_1.default);
app.use('/api/v1/settings', security_1.apiLimiter, settings_routes_1.default);
app.use('*', (_req, res) => {
    res.status(404).json({ error: 'Not Found', code: 'NOT_FOUND' });
});
app.use(errorHandler_1.errorHandler);
exports.default = app;
//# sourceMappingURL=app.js.map