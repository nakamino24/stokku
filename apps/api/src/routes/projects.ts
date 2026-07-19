import { Router, Request, Response, NextFunction } from 'express';
import { ProjectService } from '../services/projectService';
import { authMiddleware } from '../middleware/auth';
import { resolveWorkspaceId } from '../utils/workspace';
import { AppError } from '../utils/errors';
import { z } from 'zod';

const router = Router();

router.use(authMiddleware);

const createSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  status: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  workspaceId: z.string().optional(),
});

const updateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  status: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.userId;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;

    const result = await ProjectService.getUserProjects(userId, {
      skip: (page - 1) * limit,
      take: limit,
      search,
    });

    res.json({
      projects: result.data,
      pagination: { page, limit, totalPages: Math.ceil(result.count / limit), totalItems: result.count },
    });
  } catch (error) { next(error); }
});

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.userId;
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) throw AppError.badRequest('Invalid input');

    const project = await ProjectService.createProject({
      ...parsed.data,
      startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : undefined,
      endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : undefined,
      ownerId: userId,
    });

    res.status(201).json(project);
  } catch (error) { next(error); }
});

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.userId;
    const workspaceId = await resolveWorkspaceId(userId);
    const id = req.params.id as string;
    const project = await ProjectService.getProjectById(id);
    if (!project || project.workspaceId !== workspaceId) {
      throw AppError.notFound('Project not found');
    }
    res.json(project);
  } catch (error) { next(error); }
});

router.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.userId;
    const workspaceId = await resolveWorkspaceId(userId);
    const id = req.params.id as string;
    const project = await ProjectService.getProjectById(id);
    if (!project || project.workspaceId !== workspaceId) {
      throw AppError.notFound('Project not found');
    }

    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) throw AppError.badRequest('Invalid input');

    const updated = await ProjectService.updateProject(id, parsed.data);
    res.json(updated);
  } catch (error) { next(error); }
});

router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.userId;
    const workspaceId = await resolveWorkspaceId(userId);
    const id = req.params.id as string;
    const project = await ProjectService.getProjectById(id);
    if (!project || project.workspaceId !== workspaceId) {
      throw AppError.notFound('Project not found');
    }
    await ProjectService.deleteProject(id);
    res.json({ message: 'Project deleted successfully' });
  } catch (error) { next(error); }
});

export default router;
