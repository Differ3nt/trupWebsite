import { z } from 'zod';

export const createWikiArticleSchema = z.object({
  title: z.string().min(1).max(255),
  content: z.string().min(1),
  category: z.string().min(1).max(100),
  tags: z.array(z.string()).default([]),
  authorName: z.string().max(100).optional(),
});

export const updateWikiArticleSchema = createWikiArticleSchema.partial();
