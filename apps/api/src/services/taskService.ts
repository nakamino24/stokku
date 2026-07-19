import { prisma, Prisma, Task } from '@stokku/database';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

export interface TaskWithRelations extends Task {
  assignee: { id: string; name: string; avatarUrl: string | null } | null;
  project: { id: string; name: string; workspaceId: string } | null;
}

export interface PaginatedResult<T> {
  data: T[];
  count: number;
}

export class TaskService {
  static async createTask(data: Prisma.TaskCreateInput): Promise<Task> {
    if (!data.title || !data.project) {
      throw AppError.badRequest('Title and project are required');
    }
    return prisma.task.create({ data });
  }

  static async getTaskById(id: string): Promise<TaskWithRelations | null> {
    const { data } = await TaskService.getTasksWithRelations({ where: { id }, take: 1 });
    return data[0] ?? null;
  }

  static async getProjectById(projectId: string): Promise<{ id: string; workspaceId: string } | null> {
    return prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, workspaceId: true },
    });
  }

  static async getTasksInWorkspace(workspaceId: string, params: {
    skip?: number;
    take?: number;
    where?: Record<string, string>;
    orderBy?: Prisma.TaskOrderByWithRelationInput;
  }): Promise<PaginatedResult<TaskWithRelations>> {
    const { skip = 0, take = 10, where, orderBy } = params;
    const queryWhere: Prisma.TaskWhereInput = {
      project: { workspaceId },
      ...(where?.projectId ? { projectId: where.projectId } : {}),
      ...(where?.assigneeId ? { assigneeId: where.assigneeId } : {}),
      ...(where?.status ? { status: where.status } : {}),
    };

    const [data, count] = await Promise.all([
      prisma.task.findMany({
        skip, take,
        where: queryWhere,
        orderBy,
        include: {
          assignee: { select: { id: true, name: true, avatarUrl: true } },
          project: { select: { id: true, name: true, workspaceId: true } },
        },
      }),
      prisma.task.count({ where: queryWhere }),
    ]);
    return { data: data as TaskWithRelations[], count };
  }

  static async getTasks(params: {
    skip?: number;
    take?: number;
    where?: Prisma.TaskWhereInput;
    orderBy?: Prisma.TaskOrderByWithRelationInput;
  }): Promise<PaginatedResult<Task>> {
    const { skip = 0, take = 10, where, orderBy } = params;
    const [data, count] = await Promise.all([
      prisma.task.findMany({ skip, take, where, orderBy }),
      prisma.task.count({ where }),
    ]);
    return { data, count };
  }

  static async getTasksWithRelations(params: {
    skip?: number;
    take?: number;
    where?: Prisma.TaskWhereInput;
    orderBy?: Prisma.TaskOrderByWithRelationInput;
  }): Promise<PaginatedResult<TaskWithRelations>> {
    const { skip = 0, take = 10, where, orderBy } = params;
    const [data, count] = await Promise.all([
      prisma.task.findMany({
        skip, take, where, orderBy,
        include: {
          assignee: { select: { id: true, name: true, avatarUrl: true } },
          project: { select: { id: true, name: true, workspaceId: true } },
        },
      }),
      prisma.task.count({ where }),
    ]);
    return { data: data as TaskWithRelations[], count };
  }

  static async updateTask(id: string, data: Prisma.TaskUpdateInput): Promise<Task> {
    const existing = await prisma.task.findUnique({ where: { id } });
    if (!existing) throw AppError.notFound('Task not found');

    return prisma.task.update({ where: { id }, data });
  }

  static async deleteTask(id: string): Promise<void> {
    const existing = await prisma.task.findUnique({ where: { id } });
    if (!existing) throw AppError.notFound('Task not found');

    await prisma.task.delete({ where: { id } });
  }
}
