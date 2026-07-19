import { Router, Request, Response, NextFunction } from 'express';
import { CategoryService } from '../services/categoryService';
import { authMiddleware } from '../middleware/auth';
import { resolveWorkspaceId } from '../utils/workspace';
import { AppError } from '../utils/errors';
import { z } from 'zod';

const router = Router();

router.use(authMiddleware);

const createSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  parentId: z.string().optional(),
  description: z.string().optional(),
  color: z.string().optional(),
  sortOrder: z.number().int().optional(),
});

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = await resolveWorkspaceId((req as any).user.userId);
    const categories = await CategoryService.list(workspaceId);
    res.json({ categories });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = await resolveWorkspaceId((req as any).user.userId);
    const id = req.params.id as string;
    const category = await CategoryService.getById(id, workspaceId);
    res.json(category);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = await resolveWorkspaceId((req as any).user.userId);
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) throw AppError.badRequest('Invalid input', parsed.error.format());

    const category = await CategoryService.create({ workspaceId, ...parsed.data });
    res.status(201).json(category);
  } catch (error) {
    next(error);
  }
});

router.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = await resolveWorkspaceId((req as any).user.userId);
    const id = req.params.id as string;
    const { name, slug, parentId, description, color, sortOrder, isActive } = req.body;

    const category = await CategoryService.update(id, workspaceId, {
      name, slug, parentId, description, color, sortOrder, isActive,
    });

    res.json(category);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = await resolveWorkspaceId((req as any).user.userId);
    const id = req.params.id as string;
    await CategoryService.delete(id, workspaceId);
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
