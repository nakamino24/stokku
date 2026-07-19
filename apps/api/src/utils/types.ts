import { Request } from 'express';

export type AuthRequest = Request & { user?: { id: string; email: string; name: string; role: string; organizationId: string; organizationSlug: string } };
