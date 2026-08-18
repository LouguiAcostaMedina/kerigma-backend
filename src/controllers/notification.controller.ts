import type { Request, Response } from 'express';
import type { AuthUser } from '../types/auth';
import type { SendNotificationInput, ListNotificationsQuery } from '../schemas/notification.schema';
import * as notificationService from '../services/notification.service';
import { ok, paginated } from '../utils/apiResponse';
import { isGlobalAdmin } from '../utils/roles';
import { ForbiddenError } from '../utils/errors';

type NotificationScope = { churchId: string } | { churchId: null };

function resolveScope(user: AuthUser): NotificationScope {
  if (isGlobalAdmin(user)) return { churchId: null };
  if (!user.churchId) throw new ForbiddenError('El usuario no está asociado a ninguna iglesia');
  return { churchId: user.churchId };
}

export async function sendNotification(req: Request, res: Response): Promise<void> {
  const scope = resolveScope(req.user!);
  if (!scope.churchId) throw new ForbiddenError('No se pueden enviar notificaciones desde el modo global');
  const result = await notificationService.sendNotification(scope.churchId, req.user!.id, req.body as SendNotificationInput);
  res.status(201).json(ok(result, 'Notificación enviada'));
}

export async function listNotifications(req: Request, res: Response): Promise<void> {
  const scope = resolveScope(req.user!);
  const query = req.query as unknown as ListNotificationsQuery;
  const { notifications, total } = await notificationService.listNotifications(scope.churchId, query);
  res.status(200).json(paginated(notifications, total, query.page, query.limit));
}

export async function getNotification(req: Request, res: Response): Promise<void> {
  const scope = resolveScope(req.user!);
  const notification = await notificationService.getNotification(scope.churchId, req.params.id);
  res.status(200).json(ok(notification));
}

export async function cancelNotification(req: Request, res: Response): Promise<void> {
  const scope = resolveScope(req.user!);
  const notification = await notificationService.cancelNotification(scope.churchId, req.params.id);
  res.status(200).json(ok(notification, 'Notificación cancelada'));
}

export async function getNotificationStats(_req: Request, res: Response): Promise<void> {
  const scope = resolveScope(_req.user!);
  const stats = await notificationService.getNotificationStats(scope.churchId);
  res.status(200).json(ok(stats));
}
