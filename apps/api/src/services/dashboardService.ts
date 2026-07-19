import { prisma, Task } from '@stokku/database';
import { AppError } from '../utils/errors';

export interface DashboardStats {
  totalProjects: number;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
}

export interface InventoryStats {
  totalProducts: number;
  totalVariants: number;
  totalWarehouses: number;
  totalSuppliers: number;
  lowStockItems: number;
  recentMovements: number;
}

export interface RecentProject {
  id: string;
  name: string;
  description: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  _count: { Task: number };
}

export class DashboardService {
  static async getStats(userId: string): Promise<DashboardStats> {
    const workspaceIds = await DashboardService.getUserWorkspaceIds(userId);

    if (workspaceIds.length === 0) {
      return { totalProjects: 0, totalTasks: 0, completedTasks: 0, overdueTasks: 0 };
    }

    const projects = await prisma.project.findMany({
      where: { workspaceId: { in: workspaceIds } },
    });

    const projectIds = projects.map(p => p.id);

    const tasks = await prisma.task.findMany({
      where: { projectId: { in: projectIds } },
    });

    const totalProjects = projects.length;
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t: Task) => t.status === 'done').length;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const overdueTasks = tasks.filter((t: Task) => {
      if (!t.dueDate) return false;
      const dueDate = new Date(t.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate < today && t.status !== 'done';
    }).length;

    return { totalProjects, totalTasks, completedTasks, overdueTasks };
  }

  static async getInventoryStats(userId: string): Promise<InventoryStats> {
    const workspaceIds = await DashboardService.getUserWorkspaceIds(userId);
    if (workspaceIds.length === 0) {
      return { totalProducts: 0, totalVariants: 0, totalWarehouses: 0, totalSuppliers: 0, lowStockItems: 0, recentMovements: 0 };
    }

    const [products, variants, warehouses, suppliers, recentMovements] = await Promise.all([
      prisma.product.count({ where: { workspaceId: { in: workspaceIds } } }),
      prisma.productVariant.count({ where: { product: { workspaceId: { in: workspaceIds } } } }),
      prisma.warehouse.count({ where: { workspaceId: { in: workspaceIds } } }),
      prisma.supplier.count({ where: { workspaceId: { in: workspaceIds } } }),
      prisma.stockMovement.count({
        where: {
          warehouse: { workspaceId: { in: workspaceIds } },
          createdAt: { gte: new Date(Date.now() - 7 * 86400000) },
        },
      }),
    ]);

    const lowStockRows = await prisma.stockLevel.findMany({
      where: {
        warehouse: { workspaceId: { in: workspaceIds } },
        reorderPoint: { not: null },
      },
      select: { onHand: true, reorderPoint: true },
    });
    const lowStockItems = lowStockRows.filter(l => l.reorderPoint != null && l.onHand <= l.reorderPoint!).length;

    return { totalProducts: products, totalVariants: variants, totalWarehouses: warehouses, totalSuppliers: suppliers, lowStockItems, recentMovements };
  }

  static async getRecentProjects(userId: string): Promise<RecentProject[]> {
    const workspaceIds = await DashboardService.getUserWorkspaceIds(userId);

    if (workspaceIds.length === 0) {
      return [];
    }

    return prisma.project.findMany({
      where: { workspaceId: { in: workspaceIds } },
      orderBy: { updatedAt: 'desc' },
      take: 5,
      include: {
        _count: { select: { Task: true } },
      },
    }) as Promise<RecentProject[]>;
  }

  private static async getUserWorkspaceIds(userId: string): Promise<string[]> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        WorkspaceMember: { select: { workspaceId: true } },
        ownedWorkspaces: { select: { id: true } },
      },
    });

    if (!user) {
      throw AppError.notFound('User not found');
    }

    const memberIds = user.WorkspaceMember.map((wm: { workspaceId: string }) => wm.workspaceId);
    const ownedIds = user.ownedWorkspaces.map((w: { id: string }) => w.id);
    return [...new Set([...memberIds, ...ownedIds])];
  }
}
