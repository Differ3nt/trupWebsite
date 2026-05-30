import { z } from 'zod';

// Event IDs are human-readable codes (e.g. "2026_01_WYP") and article IDs are
// generated slugs — neither is a UUID, so these must be plain strings.
export const createNewsSchema = z.object({
  title: z.string().min(1).max(255),
  content: z.string().max(5000).optional(),
  type: z.enum(['GENERAL', 'EVENT', 'ARTICLE', 'ANNOUNCEMENT']).default('GENERAL'),
  imageUrl: z.string().url().optional(),
  link: z.string().url().optional(),
  eventId: z.string().optional(),
  articleId: z.string().optional(),
  priority: z.number().int().default(0).optional(),
});

export const updateNewsSchema = createNewsSchema.partial();

export const newsToggleSchema = z
  .object({
    eventId: z.string().optional(),
    articleId: z.string().optional(),
  })
  .refine((d) => d.eventId || d.articleId, 'Must provide eventId or articleId');
