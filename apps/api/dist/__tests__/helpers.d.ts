import { Express } from 'express';
export declare function createTestApp(routes: (app: Express) => void): Express;
export declare const mockUser: {
    id: string;
    email: string;
    name: string;
    role: string;
    organizationId: string;
    organizationSlug: string;
};
export declare function mockAuthMiddleware(req: any, _res: any, next: any): void;
export declare function mockOwnerMiddleware(req: any, _res: any, next: any): void;
//# sourceMappingURL=helpers.d.ts.map