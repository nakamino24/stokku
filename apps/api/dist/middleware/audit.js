"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditLog = void 0;
const database_1 = require("@stokku/database");
function auditLog(action, entityType, getEntityId) {
    return async (req, res, next) => {
        const originalJson = res.json.bind(res);
        res.json = function (body) {
            const user = req.user;
            if (user && res.statusCode < 400) {
                const entityId = getEntityId ? getEntityId(req) : (req.params.id || body?.id);
                database_1.prisma.auditLog.create({
                    data: {
                        organizationId: user.organizationId,
                        userId: user.id,
                        action,
                        entityType,
                        entityId,
                        ipAddress: req.ip,
                        userAgent: req.get('user-agent') || '',
                    },
                }).catch(() => { });
            }
            return originalJson(body);
        };
        next();
    };
}
exports.auditLog = auditLog;
//# sourceMappingURL=audit.js.map