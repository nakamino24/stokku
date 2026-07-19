import { Request, Response, NextFunction } from 'express';
import { OrganizationRole } from '@stokku/database';
export declare function requireRole(minimumRole: OrganizationRole): (req: Request, _res: Response, next: NextFunction) => void;
export declare function requirePermission(permission: string): (req: Request, _res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=rbac.d.ts.map