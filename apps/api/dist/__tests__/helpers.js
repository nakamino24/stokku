"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mockOwnerMiddleware = exports.mockAuthMiddleware = exports.mockUser = exports.createTestApp = void 0;
const express_1 = __importDefault(require("express"));
const errorHandler_1 = require("../middleware/errorHandler");
function createTestApp(routes) {
    const app = (0, express_1.default)();
    app.use(express_1.default.json());
    routes(app);
    app.use(errorHandler_1.errorHandler);
    return app;
}
exports.createTestApp = createTestApp;
exports.mockUser = {
    id: 'user-1',
    email: 'admin@test.com',
    name: 'Test Admin',
    role: 'ADMIN',
    organizationId: 'org-1',
    organizationSlug: 'test-org',
};
function mockAuthMiddleware(req, _res, next) {
    req.user = exports.mockUser;
    next();
}
exports.mockAuthMiddleware = mockAuthMiddleware;
function mockOwnerMiddleware(req, _res, next) {
    req.user = { ...exports.mockUser, role: 'OWNER' };
    next();
}
exports.mockOwnerMiddleware = mockOwnerMiddleware;
//# sourceMappingURL=helpers.js.map