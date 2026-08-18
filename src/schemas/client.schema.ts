import { z } from 'zod';

const planEnum = z.enum(['free', 'basic', 'pro', 'enterprise']);

export const createClientSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/, 'El slug solo puede contener minúsculas, números y guiones'),
  plan: planEnum.default('free'),
  maxChurches: z.number().int().min(1).default(1),
  maxUsers: z.number().int().min(1).default(5),
  contactName: z.string().max(200).optional(),
  contactEmail: z.string().email().max(200).optional(),
  contactPhone: z.string().max(50).optional(),
  trialEndsAt: z.coerce.date().optional(),
});

export const updateClientSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/, 'El slug solo puede contener minúsculas, números y guiones').optional(),
  plan: planEnum.optional(),
  maxChurches: z.number().int().min(1).optional(),
  maxUsers: z.number().int().min(1).optional(),
  contactName: z.string().max(200).optional().nullable(),
  contactEmail: z.string().email().max(200).optional().nullable(),
  contactPhone: z.string().max(50).optional().nullable(),
  isActive: z.boolean().optional(),
  trialEndsAt: z.coerce.date().optional().nullable(),
});

export const listClientsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  plan: planEnum.optional(),
  isActive: z.coerce.boolean().optional(),
  search: z.string().optional(),
});

export const slugParamSchema = z.object({
  slug: z.string().min(1),
});

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
export type ListClientsQuery = z.infer<typeof listClientsQuerySchema>;
