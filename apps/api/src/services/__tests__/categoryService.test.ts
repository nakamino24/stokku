import { prisma } from '@stokku/database';
import { CategoryService } from '../categoryService';
import { AppError } from '../../utils/errors';

jest.mock('@stokku/database', () => ({
  prisma: {
    category: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  },
}));

const mockCategory = {
  id: 'cat-1',
  workspaceId: 'ws-1',
  parentId: null,
  name: 'Raw Materials',
  slug: 'raw-materials',
  description: null,
  imageUrl: null,
  color: '#8B5CF6',
  sortOrder: 1,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('CategoryService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('list', () => {
    it('should return all categories for a workspace', async () => {
      (prisma.category.findMany as jest.Mock).mockResolvedValue([mockCategory]);
      const result = await CategoryService.list('ws-1');
      expect(result).toHaveLength(1);
      expect(prisma.category.findMany).toHaveBeenCalledWith({
        where: { workspaceId: 'ws-1' },
        orderBy: { sortOrder: 'asc' },
      });
    });
  });

  describe('create', () => {
    it('should create a category', async () => {
      (prisma.category.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.category.create as jest.Mock).mockResolvedValue(mockCategory);

      const result = await CategoryService.create({
        workspaceId: 'ws-1',
        name: 'Raw Materials',
        slug: 'raw-materials',
        color: '#8B5CF6',
      });
      expect(result).toEqual(mockCategory);
    });

    it('should throw conflict if slug already exists', async () => {
      (prisma.category.findFirst as jest.Mock).mockResolvedValue(mockCategory);
      await expect(CategoryService.create({
        workspaceId: 'ws-1',
        name: 'Raw Materials',
        slug: 'raw-materials',
      })).rejects.toThrow(AppError);
    });
  });
});
