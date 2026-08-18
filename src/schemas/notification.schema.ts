import { z } from 'zod';

const notificationChannelEnum = z.enum(['email', 'whatsapp', 'both']);

export const sendNotificationSchema = z.object({
  channel: notificationChannelEnum.default('email'),
  recipientUserId: z.string().uuid().optional(),
  recipientEmail: z.string().email().optional(),
  recipientPhone: z.string().max(20).optional(),
  subject: z.string().max(200).optional(),
  body: z.string().min(1),
  templateName: z.string().max(100).optional(),
  templateData: z.record(z.unknown()).optional(),
}).refine(
  (data) => data.recipientUserId || data.recipientEmail || data.recipientPhone,
  { message: 'Se requiere al menos un destinatario (userId, email o teléfono)' },
);

export const listNotificationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  channel: notificationChannelEnum.optional(),
  status: z.enum(['pending', 'sent', 'failed', 'cancelled']).optional(),
  templateName: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export type SendNotificationInput = z.infer<typeof sendNotificationSchema>;
export type ListNotificationsQuery = z.infer<typeof listNotificationsQuerySchema>;
