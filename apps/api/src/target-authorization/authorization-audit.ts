import { Request } from 'express';
import { prisma } from '@stokku/database';
import { logger } from '../utils/logger';

/**
 * Deny-aware authorization audit logging for the target parity probe.
 *
 * Per ADR-0017:
 * - Logs BOTH allow and deny outcomes (reference audit.ts only logs statusCode < 400)
 * - Fire-and-forget, like the reference middleware
 * - Never logs tokens, passwords, cookies, or cross-tenant data
 */

export type AuthorizationAuditEntry = {
  requestId: string;
  userId: string;
  organizationId: string;
  warehouseId?: string;
  permission: string;
  outcome: 'allow' | 'deny';
  denyReason?: string;
  ipAddress?: string;
  userAgent?: string;
};

export function extractAuditContext(req: Request): Pick<AuthorizationAuditEntry, 'ipAddress' | 'userAgent'> {
  return {
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  };
}

export function logAuthorizationDecision(entry: AuthorizationAuditEntry): void {
  // Fire-and-forget: never block the authorization response on audit write failure
  prisma.auditLog
    .create({
      data: {
        organizationId: entry.organizationId,
        userId: entry.userId,
        action: 'authorization.check',
        entityType: 'warehouse-authorization',
        entityId: entry.warehouseId || null,
        oldValues: null,
        newValues: JSON.stringify({
          requestId: entry.requestId,
          permission: entry.permission,
          outcome: entry.outcome,
          denyReason: entry.denyReason ?? null,
          warehouseId: entry.warehouseId ?? null,
        }),
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
      },
    })
    .catch((error: unknown) => {
      logger.error('Authorization audit write failed', {
        message: error instanceof Error ? error.message : 'Unknown audit error',
        requestId: entry.requestId,
      });
    });
}