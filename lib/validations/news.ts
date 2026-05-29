import { z } from 'zod';

export const createNewsSchema = z.object({
  title: z.string().min(1).max(255),
  content: z.string().max(5000).optional(),
  type: z.enum(['GENERAL', 'EVENT', 'ARTICLE', 'ANNOUNCEMENT']).default('GENERAL'),
  imageUrl: z.string().url().optional(),
  link: z.string().url().optional(),
  eventId: z.string().uuid().optional(),
  articleId: z.string().uuid().optional(),
  priority: z.number().int().default(0).optional(),
});

export const newsToggleSchema = z
  .object({
    eventId: z.string().uuid().optional(),
    articleId: z.string().uuid().optional(),
  })
  .refine((d) => d.eventId || d.articleId, 'Must provide eventId or articleId');
