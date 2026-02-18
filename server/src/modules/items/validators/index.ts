import { z } from 'zod';

export const createItemSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().max(1000).optional(),
  type: z.enum(['goods', 'service']),
  sku: z.string().max(50).optional(),
  hsnSac: z.string().max(20).optional(),
  unit: z.string().max(20).optional(),
  sellingPrice: z.number().min(0, 'Selling price must be positive'),
  purchasePrice: z.number().min(0, 'Purchase price must be positive'),
  taxRate: z.number().min(0).max(100).optional(),
});

export const updateItemSchema = createItemSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export const itemIdParamSchema = z.object({
  id: z.string().min(1, 'Item ID is required'),
});

export const itemQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
  type: z.enum(['goods', 'service']).optional(),
  isActive: z.coerce.boolean().optional(),
});
