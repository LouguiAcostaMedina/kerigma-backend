import { Router } from 'express';
import * as reportController from '../controllers/report.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { validate, validateParams, validateQuery } from '../middlewares/validate.middleware';
import { exportReportParamsSchema, idParamSchema, scheduledIdParamSchema, templateIdParamSchema } from '../schemas/params.schema';
import {
  bulkDeleteReportsSchema,
  createReportSchema,
  executeReportSchema,
  listReportsQuerySchema,
  previewReportSchema,
  scheduleReportSchema,
  shareReportSchema,
  updateReportSchema,
} from '../schemas/report.schema';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

// Predefinidos
router.get('/predefined', requireAuth, asyncHandler(reportController.listPredefinedReports));
router.post(
  '/predefined/:id/execute',
  requireAuth,
  validateParams(idParamSchema),
  validate(executeReportSchema),
  asyncHandler(reportController.executePredefinedReport),
);

// Personalizados
router.get('/custom', requireAuth, validateQuery(listReportsQuerySchema), asyncHandler(reportController.listCustomReports));
router.post('/custom', requireAuth, validate(createReportSchema), asyncHandler(reportController.createCustomReport));
router.post(
  '/custom/:id/execute',
  requireAuth,
  validateParams(idParamSchema),
  validate(executeReportSchema),
  asyncHandler(reportController.executeCustomReport),
);
router.post('/custom/:id/share', requireAuth, validateParams(idParamSchema), validate(shareReportSchema), asyncHandler(reportController.shareReport));
router.delete('/custom/bulk', requireAuth, validate(bulkDeleteReportsSchema), asyncHandler(reportController.deleteMultipleReports));
router.get('/custom/:id', requireAuth, validateParams(idParamSchema), asyncHandler(reportController.getCustomReport));
router.put('/custom/:id', requireAuth, validateParams(idParamSchema), validate(updateReportSchema), asyncHandler(reportController.updateCustomReport));
router.delete('/custom/:id', requireAuth, validateParams(idParamSchema), asyncHandler(reportController.deleteCustomReport));

// Constructor de reportes
router.get('/fields/:entity', requireAuth, asyncHandler(reportController.getAvailableFields));
router.get('/aggregations', requireAuth, asyncHandler(reportController.getAggregationFunctions));
router.post('/preview', requireAuth, validate(previewReportSchema), asyncHandler(reportController.previewReport));

// Métricas
router.get('/metrics/membership-growth', requireAuth, asyncHandler(reportController.getMembershipGrowthReport));
router.get('/metrics/group-activity', requireAuth, asyncHandler(reportController.getGroupActivityReport));
router.get('/metrics/bible-student-progress', requireAuth, asyncHandler(reportController.getBibleStudentProgressReport));

// Exportación
router.post(
  '/:reportType/:reportId/export/:format',
  requireAuth,
  validateParams(exportReportParamsSchema),
  asyncHandler(reportController.exportReport),
);

// Programación
router.post('/schedule', requireAuth, validate(scheduleReportSchema), asyncHandler(reportController.scheduleReport));
router.get('/scheduled', requireAuth, asyncHandler(reportController.listScheduledReports));
router.delete('/scheduled/:id', requireAuth, validateParams(scheduledIdParamSchema), asyncHandler(reportController.cancelScheduledReport));

// Plantillas
router.get('/templates', requireAuth, asyncHandler(reportController.getReportTemplates));
router.post('/templates/:id/create', requireAuth, validateParams(templateIdParamSchema), asyncHandler(reportController.createReportFromTemplate));

// Estadísticas
router.get('/stats/usage', requireAuth, asyncHandler(reportController.getUsageStats));
router.get('/stats/popular', requireAuth, asyncHandler(reportController.getPopularReports));

// Compartir
router.get('/shared', requireAuth, asyncHandler(reportController.listSharedReports));

export default router;
