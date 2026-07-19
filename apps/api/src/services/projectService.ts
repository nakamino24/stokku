import { prisma, Prisma, Project } from '@stokku/database';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

export interface ProjectWithRelations extends Project {
  owner: { id: string; name: string; avatarUrl: string | null } | null;
  _count: { Task: number };
}

export interface PaginatedResult<T> {
  data: T[];
  count: number;
}

async function getUserWorkspaceIds(userId: string): Promise<string[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      WorkspaceMember: { select: { workspaceId: true } },
      ownedWorkspaces: { select: { id: true } },
    },
  });
  if (!user) return [];
  const memberIds = user.WorkspaceMember.map((wm: { workspaceId: string }) => wm.workspaceId);
  const ownedIds = user.ownedWorkspaces.map((w: { id: string }) => w.id);
  return [...new Set([...memberIds, ...ownedIds])];
}

export class ProjectService {
  static async createProject(data: {
    name: string;
    description?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
    ownerId: string;
    workspaceId?: string;
  }): Promise<Project> {
    logger.info('Project:create', { name: data.name, ownerId: data.ownerId });
    let workspaceId = data.workspaceId;

    if (!workspaceId) {
      const workspace = await prisma.workspace.findFirst({
        where: { ownerId: data.ownerId },
      });
      if (!workspace) {
        const user = await prisma.user.findUnique({ where: { id: data.ownerId } });
        if (!user) throw AppError.notFound('User not found');

        workspaceId = (
          await prisma.workspace.create({
            data: { name: `${user.name}'s Workspace`, ownerId: user.id, visibility: 'private' },
          })
        ).id;
      } else {
        workspaceId = workspace.id;
      }
    }

    return prisma.project.create({
      data: {
        name: data.name,
        description: data.description ?? null,
        status: data.status ?? 'active',
        startDate: data.startDate ?? null,
        endDate: data.endDate ?? null,
        ownerId: data.ownerId,
        workspaceId,
      },
    });
  }

  static async getProjectById(id: string): Promise<ProjectWithRelations | null> {
    return prisma.project.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, avatarUrl: true } },
        _count: { select: { Task: true } },
      },
    }) as Promise<ProjectWithRelations | null>;
  }

  static async getProjects(params: {
    skip?: number;
    take?: number;
    where?: Prisma.ProjectWhereInput;
    orderBy?: Prisma.ProjectOrderByWithRelationInput;
  }): Promise<PaginatedResult<Project>> {
    const { skip = 0, take = 10, where, orderBy } = params;
    const [data, count] = await Promise.all([
      prisma.project.findMany({ skip, take, where, orderBy }),
      prisma.project.count({ where }),
    ]);
    return { data, count };
  }

  static async getProjectsWithRelations(params: {
    skip?: number;
    take?: number;
    where?: Prisma.ProjectWhereInput;
    orderBy?: Prisma.ProjectOrderByWithRelationInput;
  }): Promise<PaginatedResult<ProjectWithRelations>> {
    const { skip = 0, take = 10, where, orderBy } = params;
    const [data, count] = await Promise.all([
      prisma.project.findMany({
        skip,
        take,
        where,
        orderBy,
        include: {
          owner: { select: { id: true, name: true, avatarUrl: true } },
          _count: { select: { Task: true } },
        },
      }),
      prisma.project.count({ where }),
    ]);
    return { data: data as ProjectWithRelations[], count };
  }

  static async getUserProjects(userId: string, params: {
    skip?: number;
    take?: number;
    search?: string;
    orderBy?: Prisma.ProjectOrderByWithRelationInput;
  }): Promise<PaginatedResult<ProjectWithRelations>> {
    const { skip = 0, take = 10, search, orderBy } = params;
    const workspaceIds = await getUserWorkspaceIds(userId);

    const where: Prisma.ProjectWhereInput = {
      workspaceId: { in: workspaceIds },
      ...(search ? { name: { contains: search } } : {}),
    };

    const [data, count] = await Promise.all([
      prisma.project.findMany({
        skip,
        take,
        where,
        orderBy: orderBy ?? { createdAt: 'desc' },
        include: {
          owner: { select: { id: true, name: true, avatarUrl: true } },
          _count: { select: { Task: true } },
        },
      }),
      prisma.project.count({ where }),
    ]);
    return { data: data as ProjectWithRelations[], count };
  }

  static async updateProject(id: string, data: Prisma.ProjectUpdateInput): Promise<Project> {
    const existing = await prisma.project.findUnique({ where: { id } });
    if (!existing) throw AppError.notFound('Project not found');

    return prisma.project.update({ where: { id }, data });
  }

  static async deleteProject(id: string): Promise<void> {
    const existing = await prisma.project.findUnique({ where: { id } });
    if (!existing) throw AppError.notFound('Project not found');

    await prisma.project.delete({ where: { id } });
  }
}
