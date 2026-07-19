import { Router, Request, Response, NextFunction } from 'express';
import { TaskService } from '../services/taskService';
import { authMiddleware } from '../middleware/auth';
import { resolveWorkspaceId } from '../utils/workspace';
import { AppError } from '../utils/errors';
import { z } from 'zod';

const router = Router();

router.use(authMiddleware);

const createSchema = z.object({
  title: z.string().min(1).max(500),
  projectId: z.string().min(1),
  description: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  dueDate: z.string().optional(),
  estimatedHours: z.number().int().optional(),
  assigneeId: z.string().optional(),
  position: z.number().int().optional(),
});

const updateSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  dueDate: z.string().optional(),
  estimatedHours: z.number().int().optional(),
  assigneeId: z.string().optional(),
  position: z.number().int().optional(),
});

async function assertWorkspaceAccess(projectId: string, userId: string): Promise<string> {
  const workspaceId = await resolveWorkspaceId(userId);
  const project = await TaskService.getProjectById(projectId);
  if (!project || project.workspaceId !== workspaceId) {
    throw AppError.notFound('Project not found');
  }
  return workspaceId;
}

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.userId;
    const workspaceId = await resolveWorkspaceId(userId);
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));

    const where: Record<string, string> = {};
    if (typeof req.query.projectId === 'string') where.projectId = req.query.projectId;
    if (typeof req.query.assigneeId === 'string') where.assigneeId = req.query.assigneeId;
    if (typeof req.query.status === 'string') where.status = req.query.status;

    const result = await TaskService.getTasksInWorkspace(workspaceId, {
      skip: (page - 1) * limit,
      take: limit,
      where,
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      tasks: result.data,
      pagination: { page, limit, totalPages: Math.ceil(result.count / limit), totalItems: result.count },
    });
  } catch (error) { next(error); }
});

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.userId;
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) throw AppError.badRequest('Invalid input');

    await assertWorkspaceAccess(parsed.data.projectId, userId);

    const task = await TaskService.createTask({
      title: parsed.data.title,
      project: { connect: { id: parsed.data.projectId } },
      reporter: { connect: { id: userId } },
      description: parsed.data.description ?? undefined,
      status: parsed.data.status ?? 'todo',
      priority: parsed.data.priority ?? 'medium',
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : undefined,
      estimatedHours: parsed.data.estimatedHours ?? undefined,
      assignee: parsed.data.assigneeId ? { connect: { id: parsed.data.assigneeId } } : undefined,
      position: parsed.data.position ?? 0,
    });

    res.status(201).json(task);
  } catch (error) { next(error); }
});

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.userId;
    const workspaceId = await resolveWorkspaceId(userId);
    const id = req.params.id as string;
    const task = await TaskService.getTaskById(id);
    if (!task || !task.project || task.project.workspaceId !== workspaceId) {
      throw AppError.notFound('Task not found');
    }
    res.json(task);
  } catch (error) { next(error); }
});

router.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.userId;
    const workspaceId = await resolveWorkspaceId(userId);
    const id = req.params.id as string;
    const existing = await TaskService.getTaskById(id);
    if (!existing || !existing.project || existing.project.workspaceId !== workspaceId) {
      throw AppError.notFound('Task not found');
    }

    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) throw AppError.badRequest('Invalid input');

    const task = await TaskService.updateTask(id, {
      ...parsed.data,
      assignee: parsed.data.assigneeId ? { connect: { id: parsed.data.assigneeId } } : undefined,
    });

    res.json(task);
  } catch (error) { next(error); }
});

router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.userId;
    const workspaceId = await resolveWorkspaceId(userId);
    const id = req.params.id as string;
    const existing = await TaskService.getTaskById(id);
    if (!existing || !existing.project || existing.project.workspaceId !== workspaceId) {
      throw AppError.notFound('Task not found');
    }
    await TaskService.deleteTask(id);
    res.json({ message: 'Task deleted successfully' });
  } catch (error) { next(error); }
});

export default router;
