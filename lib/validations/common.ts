import { z } from 'zod';

export const idSchema = z.string().uuid();

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const searchSchema = z.object({
  q: z.string().min(3).max(100),
});
