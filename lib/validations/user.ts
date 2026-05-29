import { z } from 'zod';

export const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  nickname: z.string().max(50).optional().nullable(),
  phoneNumber: z.string().max(20).optional().nullable(),
  hardware: z.array(z.string()).optional(),
});

export const updateUserRoleSchema = z.object({
  role: z.enum(['USER', 'ADMIN']),
});

export const updateUserStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE', 'FLAGGED']),
});
