import { Router, Request, Response, NextFunction } from 'express';
import { ProductService } from '../services/productService';
import { authMiddleware } from '../middleware/auth';
import { resolveWorkspaceId } from '../utils/workspace';
import { AppError } from '../utils/errors';
import { z } from 'zod';

const router = Router();

router.use(authMiddleware);

const createSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  categoryId: z.string().optional(),
  description: z.string().optional(),
  baseUom: z.string().optional(),
  tags: z.array(z.string()).optional(),
  initialVariant: z.object({
    sku: z.string().min(1, 'SKU is required'),
    name: z.string().min(1, 'Variant name is required'),
    price: z.number().positive().optional(),
    costPrice: z.number().positive().optional(),
    barcode: z.string().optional(),
  }),
});

const variantSchema = z.object({
  sku: z.string().min(1, 'SKU is required'),
  name: z.string().min(1, 'Variant name is required'),
  price: z.number().positive().optional(),
  costPrice: z.number().positive().optional(),
  barcode: z.string().optional(),
  options: z.record(z.string()).optional(),
});

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = await resolveWorkspaceId((req as any).user.userId);
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;
    const categoryId = typeof req.query.categoryId === 'string' ? req.query.categoryId : undefined;
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;

    const result = await ProductService.list(workspaceId, {
      skip: (page - 1) * limit,
      take: limit,
      search,
      categoryId,
      status,
    });

    res.json({
      products: result.data,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(result.count / limit),
        totalItems: result.count,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = await resolveWorkspaceId((req as any).user.userId);
    const id = req.params.id as string;
    const product = await ProductService.getById(id, workspaceId);
    res.json(product);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = await resolveWorkspaceId((req as any).user.userId);
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) throw AppError.badRequest('Invalid input', parsed.error.format());

    const product = await ProductService.create({ workspaceId, ...parsed.data });
    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
});

router.post('/:id/variants', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = await resolveWorkspaceId((req as any).user.userId);
    const productId = req.params.id as string;
    const parsed = variantSchema.safeParse(req.body);
    if (!parsed.success) throw AppError.badRequest('Invalid input', parsed.error.format());

    const variant = await ProductService.addVariant(productId, workspaceId, parsed.data);
    res.status(201).json(variant);
  } catch (error) {
    next(error);
  }
});

router.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = await resolveWorkspaceId((req as any).user.userId);
    const id = req.params.id as string;
    const { name, description, categoryId, baseUom, status, tags } = req.body;

    const product = await ProductService.update(id, workspaceId, {
      name, description, categoryId, baseUom, status, tags,
    });

    res.json(product);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const workspaceId = await resolveWorkspaceId((req as any).user.userId);
    const id = req.params.id as string;
    await ProductService.delete(id, workspaceId);
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
