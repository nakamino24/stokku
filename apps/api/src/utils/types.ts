import { Request } from 'express';

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  organizationId: string;
  organizationSlug: string;
  sessionId: string;
  emailVerified: boolean;
};

export type AuthRequest = Request & { user?: AuthUser };
