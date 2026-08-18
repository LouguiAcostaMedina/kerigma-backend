import { z } from 'zod';

export const createAssociationSchema = z.object({
  name: z.string().min(1).max(200),
  code: z.string().max(20).optional(),
  description: z.string().optional(),
  country: z.string().default('Peru'),
  territory: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
});

export const updateAssociationSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  code: z.string().max(20).optional().nullable(),
  description: z.string().optional().nullable(),
  country: z.string().optional(),
  territory: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  address: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

export const listAssociationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  country: z.string().optional(),
});

export const createDistrictSchema = z.object({
  associationId: z.string().uuid(),
  name: z.string().min(1).max(200),
  code: z.string().max(20).optional(),
  description: z.string().optional(),
  territory: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
});

export const updateDistrictSchema = z.object({
  associationId: z.string().uuid().optional(),
  name: z.string().min(1).max(200).optional(),
  code: z.string().max(20).optional().nullable(),
  description: z.string().optional().nullable(),
  territory: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  isActive: z.boolean().optional(),
});

export const listDistrictsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  associationId: z.string().uuid().optional(),
});

export type CreateAssociationInput = z.infer<typeof createAssociationSchema>;
export type UpdateAssociationInput = z.infer<typeof updateAssociationSchema>;
export type ListAssociationsQuery = z.infer<typeof listAssociationsQuerySchema>;
export type CreateDistrictInput = z.infer<typeof createDistrictSchema>;
export type UpdateDistrictInput = z.infer<typeof updateDistrictSchema>;
export type ListDistrictsQuery = z.infer<typeof listDistrictsQuerySchema>;
