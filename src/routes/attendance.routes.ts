import { Router, type Request, type Response } from 'express';
import rateLimit from 'express-rate-limit';
import { env } from '../config/env';
import * as attendanceController from '../controllers/attendance.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { validate, validateQuery } from '../middlewares/validate.middleware';
import { createAttendanceBulkSchema, listAttendanceQuerySchema, publicCheckinSchema } from '../schemas/metric.schema';
import { asyncHandler } from '../utils/asyncHandler';
import { fail } from '../utils/apiResponse';

const router = Router();

const checkinLimiter = rateLimit({
  windowMs: env.rateLimit.checkinWindowMs,
  max: env.rateLimit.checkinMax,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, res: Response) => {
    res.status(429).json(fail('TOO_MANY_REQUESTS', 'Demasiados registros desde esta IP. Intente nuevamente más tarde'));
  },
});

router.post('/bulk', requireAuth, validate(createAttendanceBulkSchema), asyncHandler(attendanceController.recordBulkAttendance));
router.get(
  '/group/:groupId',
  requireAuth,
  validateQuery(listAttendanceQuerySchema),
  asyncHandler(attendanceController.listAttendanceByGroup),
);

router.get('/checkin/:groupId', asyncHandler(attendanceController.getCheckinPage));
router.post('/checkin/:groupId', checkinLimiter, validate(publicCheckinSchema), asyncHandler(attendanceController.publicCheckin));

export default router;
