"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requirePermission = exports.requireRole = void 0;
const database_1 = require("@stokku/database");
const errors_1 = require("../utils/errors");
const ROLE_HIERARCHY = {
    OWNER: 100,
    ADMIN: 90,
    INVENTORY_MANAGER: 70,
    WAREHOUSE_STAFF: 50,
    CASHIER: 30,
    VIEWER: 10,
};
function requireRole(minimumRole) {
    return (req, _res, next) => {
        const user = req.user;
        if (!user)
            return next(errors_1.AppError.unauthorized());
        const userLevel = ROLE_HIERARCHY[user.role] ?? 0;
        const requiredLevel = ROLE_HIERARCHY[minimumRole];
        if (userLevel < requiredLevel) {
            return next(errors_1.AppError.forbidden('Insufficient permissions'));
        }
        next();
    };
}
exports.requireRole = requireRole;
function requirePermission(permission) {
    return async (req, _res, next) => {
        try {
            const user = req.user;
            if (!user)
                return next(errors_1.AppError.unauthorized());
            const roleLevel = ROLE_HIERARCHY[user.role] ?? 0;
            if (roleLevel >= ROLE_HIERARCHY.ADMIN)
                return next();
            const roles = await database_1.prisma.role.findMany({
                where: { organizationId: user.organizationId, slug: user.role.toLowerCase() },
                include: { permissions: { where: { permission } } },
            });
            const hasPermission = roles.some(r => (r.permissions ?? []).length > 0);
            if (!hasPermission) {
                return next(errors_1.AppError.forbidden(`Missing permission: ${permission}`));
            }
            next();
        }
        catch (err) {
            next(err);
        }
    };
}
exports.requirePermission = requirePermission;
//# sourceMappingURL=rbac.js.map