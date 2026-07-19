"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const zod_1 = require("zod");
const errors_1 = require("../utils/errors");
function validate(schemas) {
    return (req, _res, next) => {
        try {
            if (schemas.body)
                req.body = schemas.body.parse(req.body);
            if (schemas.query)
                req.query = schemas.query.parse(req.query);
            if (schemas.params)
                req.params = schemas.params.parse(req.params);
            next();
        }
        catch (err) {
            if (err instanceof zod_1.ZodError) {
                const details = err.errors.map((e) => ({
                    path: e.path.join('.'),
                    message: e.message,
                }));
                next(errors_1.AppError.badRequest('Validation failed', details));
            }
            else {
                next(err);
            }
        }
    };
}
exports.validate = validate;
//# sourceMappingURL=validate.js.map