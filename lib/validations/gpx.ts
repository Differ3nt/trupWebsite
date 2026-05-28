import { z } from 'zod';

export const gpxUploadSchema = z.object({
  eventId: z.string().uuid(),
  label: z.string().max(100).optional(),
  participantIds: z.array(z.string().uuid()).optional().default([]),
  manualDuration: z.coerce.number().positive().optional(),
});

export const updateGpxSchema = z.object({
  label: z.string().max(100).optional(),
  participantIds: z.array(z.string().uuid()).optional(),
  isOfficial: z.boolean().optional(),
  order: z.number().int().min(0).optional(),
});
