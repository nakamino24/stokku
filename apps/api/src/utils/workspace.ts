import { prisma } from '@stokku/database';
import { AppError } from './errors';

export async function resolveWorkspaceId(userId: string): Promise<string> {
  const member = await prisma.workspaceMember.findFirst({
    where: { userId },
    include: { workspace: { select: { id: true } } },
  });
  if (member) return member.workspace.id;

  const workspace = await prisma.workspace.findFirst({
    where: { ownerId: userId },
    select: { id: true },
  });
  if (workspace) return workspace.id;

  const created = await prisma.workspace.create({
    data: { name: 'Default Workspace', ownerId: userId, visibility: 'private' },
  });
  return created.id;
}
