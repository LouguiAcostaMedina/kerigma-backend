import { z } from 'zod';

const documentCategoryEnum = z.enum([
  'policy',
  'certificate',
  'report',
  'photo',
  'video',
  'audio',
  'template',
  'other',
]);

export const createDocumentSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  category: documentCategoryEnum.default('other'),
  fileUrl: z.string().min(1),
  fileName: z.string().min(1).max(200),
  fileSize: z.number().optional(),
  mimeType: z.string().optional(),
  memberId: z.string().uuid().optional(),
  groupId: z.string().uuid().optional(),
  isPublic: z.boolean().default(false),
});

export const updateDocumentSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional().nullable(),
  category: documentCategoryEnum.optional(),
  fileUrl: z.string().min(1).optional(),
  fileName: z.string().min(1).max(200).optional(),
  fileSize: z.number().optional().nullable(),
  mimeType: z.string().optional().nullable(),
  memberId: z.string().uuid().optional().nullable(),
  groupId: z.string().uuid().optional().nullable(),
  isPublic: z.boolean().optional(),
});

export const listDocumentsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  category: documentCategoryEnum.optional(),
  memberId: z.string().uuid().optional(),
  isPublic: z.coerce.boolean().optional(),
  search: z.string().optional(),
});

export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;
export type ListDocumentsQuery = z.infer<typeof listDocumentsQuerySchema>;
