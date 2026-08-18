import { Router } from 'express';
import * as notificationController from '../controllers/notification.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { scopeByChurch } from '../middlewares/scopeByChurch';
import { validate, validateParams, validateQuery } from '../middlewares/validate.middleware';
import { idParamSchema } from '../schemas/params.schema';
import { sendNotificationSchema, listNotificationsQuerySchema } from '../schemas/notification.schema';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.get('/stats', requireAuth, scopeByChurch(), asyncHandler(notificationController.getNotificationStats));

router.get('/', requireAuth, scopeByChurch(), validateQuery(listNotificationsQuerySchema), asyncHandler(notificationController.listNotifications));

router.post('/', requireAuth, scopeByChurch(), validate(sendNotificationSchema), asyncHandler(notificationController.sendNotification));

router.get('/:id', requireAuth, scopeByChurch(), validateParams(idParamSchema), asyncHandler(notificationController.getNotification));

router.patch('/:id/cancel', requireAuth, scopeByChurch(), validateParams(idParamSchema), asyncHandler(notificationController.cancelNotification));

export default router;
