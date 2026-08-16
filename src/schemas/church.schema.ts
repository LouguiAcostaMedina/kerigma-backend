import { z } from 'zod';
import { toTitleCase } from '../utils/text';

const titleCase = (v: string): string => toTitleCase(v);

const commonChurchFields = {
  name: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres').max(200, 'El nombre es demasiado largo'),
  address: z.string().trim().min(2, 'La dirección es requerida').max(2000, 'La dirección es demasiado larga'),
  city: z.string().trim().min(1, 'La ciudad es requerida').max(100, 'La ciudad es demasiado larga').transform(titleCase),
  state: z.string().trim().min(1, 'El departamento es requerido').max(100, 'El departamento es demasiado largo').transform(titleCase),
  country: z.string().trim().min(1, 'El país es requerido').max(100, 'El país es demasiado largo').default('Perú').transform(titleCase),
  zipCode: z.string().trim().max(20, 'El código postal es demasiado largo').nullable().optional(),
  latitude: z.string().trim().max(20).nullable().optional(),
  longitude: z.string().trim().max(20).nullable().optional(),
  phone: z.string().trim().max(20, 'El teléfono es demasiado largo').nullable().optional(),
  email: z.string().trim().toLowerCase().email('Debe proporcionar un email válido').max(255).nullable().optional(),
  website: z.string().trim().max(255, 'La URL es demasiado larga').nullable().optional(),
  socialMedia: z.record(z.unknown()).nullable().optional(),
  pastor: z.string().trim().max(200, 'El nombre del pastor es demasiado largo').nullable().optional(),
  pastorPhone: z.string().trim().max(20, 'El teléfono del pastor es demasiado largo').nullable().optional(),
  pastorEmail: z.string().trim().toLowerCase().email('El email del pastor no es válido').max(255).nullable().optional(),
  pastorId: z.string().uuid('El identificador del pastor no es válido').nullable().optional(),
  leaderId: z.string().uuid('El identificador del líder no es válido').nullable().optional(),
  capacity: z.number().int().min(1, 'La capacidad debe ser mayor a 0').nullable().optional(),
  facilities: z.record(z.unknown()).nullable().optional(),
  services: z.record(z.unknown()).nullable().optional(),
  status: z.enum(['active', 'construction', 'planning', 'inactive']).optional(),
  foundedDate: z.string().date('La fecha de fundación no es válida').nullable().optional(),
  description: z.string().trim().max(5000, 'La descripción es demasiado larga').nullable().optional(),
};

export const createChurchSchema = z.object(commonChurchFields);

export const updateChurchSchema = z.object({
  name: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres').max(200, 'El nombre es demasiado largo').optional(),
  address: z.string().trim().min(2, 'La dirección es requerida').max(2000, 'La dirección es demasiado larga').optional(),
  city: z.string().trim().min(1, 'La ciudad es requerida').max(100, 'La ciudad es demasiado larga').transform(titleCase).optional(),
  state: z.string().trim().min(1, 'El departamento es requerido').max(100, 'El departamento es demasiado largo').transform(titleCase).optional(),
  country: z.string().trim().min(1, 'El país es requerido').max(100, 'El país es demasiado largo').transform(titleCase).optional(),
  zipCode: z.string().trim().max(20, 'El código postal es demasiado largo').nullable().optional(),
  latitude: z.string().trim().max(20).nullable().optional(),
  longitude: z.string().trim().max(20).nullable().optional(),
  phone: z.string().trim().max(20, 'El teléfono es demasiado largo').nullable().optional(),
  email: z.string().trim().toLowerCase().email('Debe proporcionar un email válido').max(255).nullable().optional(),
  website: z.string().trim().max(255, 'La URL es demasiado larga').nullable().optional(),
  socialMedia: z.record(z.unknown()).nullable().optional(),
  pastor: z.string().trim().max(200, 'El nombre del pastor es demasiado largo').nullable().optional(),
  pastorPhone: z.string().trim().max(20, 'El teléfono del pastor es demasiado largo').nullable().optional(),
  pastorEmail: z.string().trim().toLowerCase().email('El email del pastor no es válido').max(255).nullable().optional(),
  pastorId: z.string().uuid('El identificador del pastor no es válido').nullable().optional(),
  leaderId: z.string().uuid('El identificador del líder no es válido').nullable().optional(),
  capacity: z.number().int().min(1, 'La capacidad debe ser mayor a 0').nullable().optional(),
  facilities: z.record(z.unknown()).nullable().optional(),
  services: z.record(z.unknown()).nullable().optional(),
  status: z.enum(['active', 'construction', 'planning', 'inactive']).optional(),
  foundedDate: z.string().date('La fecha de fundación no es válida').nullable().optional(),
  description: z.string().trim().max(5000, 'La descripción es demasiado larga').nullable().optional(),
});

export const listChurchesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(200).default('').transform((v) => (v === '' ? undefined : v)),
  status: z.preprocess(
    (v) => (v === '' || v === undefined ? undefined : v),
    z.enum(['active', 'construction', 'planning', 'inactive']).optional(),
  ),
  city: z.string().trim().max(100).default('').transform((v) => (v === '' ? undefined : v)),
  state: z.string().trim().max(100).default('').transform((v) => (v === '' ? undefined : v)),
  country: z.string().trim().max(100).default('').transform((v) => (v === '' ? undefined : v)),
  minMembers: z.preprocess((v) => (v === '' || v === undefined ? undefined : v), z.coerce.number().int().min(0).optional()),
  maxMembers: z.preprocess((v) => (v === '' || v === undefined ? undefined : v), z.coerce.number().int().min(0).optional()),
  sortBy: z
    .enum(['name', 'city', 'state', 'status', 'foundedDate', 'createdAt', 'membersCount'])
    .default('createdAt'),
  sortOrder: z.preprocess(
    (v) => (typeof v === 'string' ? v.toUpperCase() : v),
    z.enum(['ASC', 'DESC']).default('DESC'),
  ),
});

export const nearbyChurchesQuerySchema = z.object({
  latitude: z.coerce.number().min(-90).max(90, 'La latitud debe estar entre -90 y 90'),
  longitude: z.coerce.number().min(-180).max(180, 'La longitud debe estar entre -180 y 180'),
  radiusKm: z.coerce.number().positive('El radio debe ser mayor a 0').max(500, 'El radio máximo es 500 km').default(25),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

export type CreateChurchInput = z.infer<typeof createChurchSchema>;
export type UpdateChurchInput = z.infer<typeof updateChurchSchema>;
export type ListChurchesQuery = z.infer<typeof listChurchesQuerySchema>;
export type NearbyChurchesQuery = z.infer<typeof nearbyChurchesQuerySchema>;
