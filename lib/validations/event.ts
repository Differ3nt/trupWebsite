import { z } from 'zod';

const eventTypeSchema = z.enum(['GÓRY', 'INTEGRACJA', 'KULTURA']);

const baseEventSchema = z.object({
  title: z.string().min(1).max(255),
  type: eventTypeSchema,
  dateStart: z.string().datetime().or(z.date()).pipe(z.coerce.date()),
  dateEnd: z.string().datetime().or(z.date()).pipe(z.coerce.date()).optional(),
  description: z.string().max(5000).optional(),
  location: z.string().max(255).optional(),
  image: z.string().url().optional(),
  spots: z.number().int().positive().nullable().optional(),
  isDraft: z.boolean().default(false),
  difficulty: z.number().int().min(1).max(5).optional(),
  organizer: z.string().max(255).optional(),
  transport: z.string().max(1000).optional(),
  weatherInfo: z.string().max(1000).optional(),
  mapLink: z.string().url().optional(),
  mapEmbed: z.string().optional(),
  meetingPointName: z.string().max(255).optional(),
  meetingPointLink: z.string().url().optional(),
  meetingPointEmbed: z.string().optional(),
  plannedDistance: z.number().positive().optional(),
  plannedElevation: z.number().positive().optional(),
  plannedDuration: z.number().positive().optional(),
  imageFocalX: z.number().min(0).max(100).default(50),
  imageFocalY: z.number().min(0).max(100).default(50),
  gearRequired: z.array(z.string()).default([]),
  gearCritical: z.array(z.string()).default([]),
  featured: z.boolean().optional(),
  highlighted: z.boolean().optional(),
});

export const createEventSchema = baseEventSchema;

export const updateEventSchema = baseEventSchema.partial();
