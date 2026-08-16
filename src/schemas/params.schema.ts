import { z } from 'zod';

const uuid = (message: string) => z.string().uuid(message);

export const idParamSchema = z.object({
  id: uuid('El identificador no es válido'),
});

export const nameParamSchema = z.object({
  name: z.string().trim().min(1, 'El nombre del catálogo es requerido').max(50, 'Nombre de catálogo demasiado largo'),
});

export const memberIdParamSchema = z.object({
  memberId: uuid('El identificador del miembro no es válido'),
});

export const groupIdParamSchema = z.object({
  groupId: uuid('El identificador del grupo no es válido'),
});

export const studentIdParamSchema = z.object({
  studentId: uuid('El identificador del estudiante no es válido'),
});

export const quarterIdParamSchema = z.object({
  quarterId: uuid('El identificador del trimestre no es válido'),
});

export const exportReportParamsSchema = z.object({
  reportType: z.enum(['predefined', 'custom']),
  reportId: uuid('El identificador del reporte no es válido'),
  format: z.enum(['excel', 'pdf', 'csv']),
});

export const templateIdParamSchema = z.object({
  id: uuid('El identificador de la plantilla no es válido'),
});

export const scheduledIdParamSchema = z.object({
  id: uuid('El identificador del reporte programado no es válido'),
});
