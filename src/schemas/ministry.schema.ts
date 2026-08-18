import { z } from 'zod';

export const createMinistrySchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  category: z.string().default('general'),
  leaderId: z.string().uuid().optional(),
  meetingSchedule: z.string().optional(),
});

export const updateMinistrySchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().optional().nullable(),
  category: z.string().optional(),
  leaderId: z.string().uuid().optional().nullable(),
  meetingSchedule: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

export const listMinistriesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  category: z.string().optional(),
});

export const assignMemberSchema = z.object({
  memberId: z.string().uuid(),
  role: z.string().default('volunteer'),
  notes: z.string().optional(),
});

export const listAssignmentsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  isActive: z.coerce.boolean().optional(),
});

export type CreateMinistryInput = z.infer<typeof createMinistrySchema>;
export type UpdateMinistryInput = z.infer<typeof updateMinistrySchema>;
export type ListMinistriesQuery = z.infer<typeof listMinistriesQuerySchema>;
export type AssignMemberInput = z.infer<typeof assignMemberSchema>;
export type ListAssignmentsQuery = z.infer<typeof listAssignmentsQuerySchema>;
