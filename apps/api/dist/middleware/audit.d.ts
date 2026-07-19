/// <reference types="cookie-parser" />
import { Request, Response, NextFunction } from 'express';
export declare function auditLog(action: string, entityType: string, getEntityId?: (req: Request) => string | undefined): (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=audit.d.ts.map