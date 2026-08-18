import { z } from 'zod';

const eventTypeEnum = z.enum(['worship', 'study', 'social', 'outreach', 'meeting', 'other']);
const recurrenceEnum = z.enum(['none', 'weekly', 'biweekly', 'monthly', 'yearly']);

export const createActivitySchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  eventType: eventTypeEnum.default('other'),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  location: z.string().max(200).optional(),
  recurrence: recurrenceEnum.default('none'),
  groupId: z.string().uuid().optional(),
});

export const updateActivitySchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  eventType: eventTypeEnum.optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  location: z.string().max(200).optional(),
  recurrence: recurrenceEnum.optional(),
  groupId: z.string().uuid().optional().nullable(),
  isActive: z.boolean().optional(),
});

export const listActivitiesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  eventType: eventTypeEnum.optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  groupId: z.string().uuid().optional(),
  search: z.string().optional(),
});

export type CreateActivityInput = z.infer<typeof createActivitySchema>;
export type UpdateActivityInput = z.infer<typeof updateActivitySchema>;
export type ListActivitiesQuery = z.infer<typeof listActivitiesQuerySchema>;
