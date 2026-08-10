import { Router } from 'express';
import * as metricController from '../controllers/metric.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { validate, validateQuery } from '../middlewares/validate.middleware';
import { createWeeklyMetricSchema, listWeeklyMetricsQuerySchema } from '../schemas/metric.schema';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.post('/weekly', requireAuth, validate(createWeeklyMetricSchema), asyncHandler(metricController.createWeeklyMetric));
router.get(
  '/weekly/group/:groupId',
  requireAuth,
  validateQuery(listWeeklyMetricsQuerySchema),
  asyncHandler(metricController.listWeeklyMetricsByGroup),
);
router.get('/weekly', requireAuth, asyncHandler(metricController.listWeeklyMetricsByChurch));

export default router;
