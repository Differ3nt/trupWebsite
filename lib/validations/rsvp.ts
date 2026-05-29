import { z } from 'zod';

export const rsvpSchema = z.object({
  status: z.enum(['GOING', 'INTERESTED']).nullable(),
  notifyDaysBefore: z.number().int().min(0).max(30).nullable().optional(),
});
