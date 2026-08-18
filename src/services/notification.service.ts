import { Op, type WhereOptions } from 'sequelize';
import { db } from '../models';
import type { Notification } from '../models/Notification.model';
import type {
  SendNotificationInput,
  ListNotificationsQuery,
} from '../schemas/notification.schema';
import { NotFoundError, ValidationError } from '../utils/errors';
import { env } from '../config/env';
import logger from '../utils/logger';

export interface NotificationSummary {
  id: string;
  churchId: string;
  channel: Notification['channel'];
  recipientUserId: string | null;
  recipientEmail: string | null;
  recipientPhone: string | null;
  subject: string | null;
  body: string;
  templateName: string | null;
  status: Notification['status'];
  errorMessage: string | null;
  sentAt: Date | null;
  createdBy: string;
  createdAt: Date;
}

export interface NotificationsPaginatedResult {
  notifications: NotificationSummary[];
  total: number;
}

function toNotificationSummary(n: Notification): NotificationSummary {
  return {
    id: n.id,
    churchId: n.churchId,
    channel: n.channel,
    recipientUserId: n.recipientUserId,
    recipientEmail: n.recipientEmail,
    recipientPhone: n.recipientPhone,
    subject: n.subject,
    body: n.body,
    templateName: n.templateName,
    status: n.status,
    errorMessage: n.errorMessage,
    sentAt: n.sentAt,
    createdBy: n.createdBy,
    createdAt: n.createdAt,
  };
}

async function resolveRecipient(input: SendNotificationInput): Promise<{
  recipientUserId: string | null;
  recipientEmail: string | null;
  recipientPhone: string | null;
}> {
  let recipientUserId = input.recipientUserId ?? null;
  let recipientEmail = input.recipientEmail ?? null;
  let recipientPhone = input.recipientPhone ?? null;

  if (recipientUserId) {
    const user = await db.User.findByPk(recipientUserId);
    if (!user) throw new NotFoundError('Usuario destinatario no encontrado');
    if (!recipientEmail) recipientEmail = user.email;
    if (!recipientPhone) recipientPhone = user.phone;
  }

  return { recipientUserId, recipientEmail, recipientPhone };
}

async function sendViaEmail(email: string, subject: string, body: string): Promise<void> {
  if (env.isTest) {
    logger.info(`[notification][email] To: ${email} | Subject: ${subject}`);
    return;
  }
  try {
    const { sendEmail } = await import('./email.service');
    await sendEmail({ to: email, subject, text: body });
  } catch (err) {
    logger.error(`[notification][email] Failed to send to ${email}:`, err);
    throw err;
  }
}

async function sendViaWhatsApp(phone: string, body: string): Promise<void> {
  if (env.isTest || env.isDevelopment) {
    logger.info(`[notification][whatsapp] To: ${phone} | Body: ${body}`);
    return;
  }
  logger.warn(`[notification][whatsapp] WhatsApp sending not yet configured. Message to ${phone} logged only.`);
}

export async function sendNotification(
  churchId: string,
  userId: string,
  input: SendNotificationInput,
): Promise<NotificationSummary> {
  const { recipientUserId, recipientEmail, recipientPhone } = await resolveRecipient(input);

  const notification = await db.Notification.create({
    churchId,
    channel: input.channel,
    recipientUserId,
    recipientEmail,
    recipientPhone,
    subject: input.subject ?? null,
    body: input.body,
    templateName: input.templateName ?? null,
    templateData: input.templateData ?? null,
    status: 'pending',
    createdBy: userId,
  });

  let finalStatus: Notification['status'] = 'sent';
  let errorMessage: string | null = null;
  let sentAt: Date | null = null;

  try {
    if (input.channel === 'email' || input.channel === 'both') {
      if (recipientEmail) {
        await sendViaEmail(recipientEmail, input.subject || 'Notificación', input.body);
      } else {
        throw new ValidationError('No hay dirección de email para el destinatario');
      }
    }

    if (input.channel === 'whatsapp' || input.channel === 'both') {
      if (recipientPhone) {
        await sendViaWhatsApp(recipientPhone, input.body);
      } else {
        throw new ValidationError('No hay número de teléfono para el destinatario');
      }
    }

    sentAt = new Date();
  } catch (err) {
    finalStatus = 'failed';
    errorMessage = err instanceof Error ? err.message : 'Error desconocido';
  }

  await notification.update({ status: finalStatus, errorMessage, sentAt });

  return toNotificationSummary(notification);
}

export async function listNotifications(
  churchId: string | null,
  query: ListNotificationsQuery,
): Promise<NotificationsPaginatedResult> {
  const { page, limit, channel, status, templateName, startDate, endDate } = query;

  const where: WhereOptions = {};
  if (churchId) {
    (where as Record<string, unknown>).churchId = churchId;
  }
  if (channel) {
    (where as Record<string, unknown>).channel = channel;
  }
  if (status) {
    (where as Record<string, unknown>).status = status;
  }
  if (templateName) {
    (where as Record<string, unknown>).templateName = templateName;
  }
  if (startDate || endDate) {
    const dateFilter: Record<string, Date> = {};
    if (startDate) dateFilter[Op.gte as unknown as string] = startDate;
    if (endDate) dateFilter[Op.lte as unknown as string] = endDate;
    (where as Record<string, unknown>).createdAt = dateFilter;
  }

  const { rows, count } = await db.Notification.findAndCountAll({
    where,
    order: [['createdAt', 'DESC']],
    limit,
    offset: (page - 1) * limit,
    subQuery: false,
  });

  return {
    notifications: rows.map(toNotificationSummary),
    total: count,
  };
}

export async function getNotification(
  churchId: string | null,
  notificationId: string,
): Promise<NotificationSummary> {
  const notification = await db.Notification.findByPk(notificationId);
  if (!notification) {
    throw new NotFoundError('Notificación no encontrada');
  }
  if (churchId && notification.churchId !== churchId) {
    throw new NotFoundError('Notificación no encontrada');
  }
  return toNotificationSummary(notification);
}

export async function cancelNotification(
  churchId: string | null,
  notificationId: string,
): Promise<NotificationSummary> {
  const notification = await db.Notification.findByPk(notificationId);
  if (!notification) {
    throw new NotFoundError('Notificación no encontrada');
  }
  if (churchId && notification.churchId !== churchId) {
    throw new NotFoundError('Notificación no encontrada');
  }
  if (notification.status !== 'pending') {
    throw new ValidationError('Solo se pueden cancelar notificaciones pendientes');
  }

  await notification.update({ status: 'cancelled' });
  return toNotificationSummary(notification);
}

export async function getNotificationStats(churchId: string | null): Promise<{
  total: number;
  sent: number;
  failed: number;
  pending: number;
  byChannel: Record<string, number>;
}> {
  const where: WhereOptions = {};
  if (churchId) {
    (where as Record<string, unknown>).churchId = churchId;
  }

  const all = await db.Notification.findAll({ where, attributes: ['status', 'channel'] });
  const stats = {
    total: all.length,
    sent: 0,
    failed: 0,
    pending: 0,
    byChannel: {} as Record<string, number>,
  };

  for (const n of all) {
    if (n.status === 'sent') stats.sent++;
    else if (n.status === 'failed') stats.failed++;
    else if (n.status === 'pending') stats.pending++;
    stats.byChannel[n.channel] = (stats.byChannel[n.channel] || 0) + 1;
  }

  return stats;
}
