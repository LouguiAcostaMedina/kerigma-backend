import { Router } from 'express';
import * as pastoralCareController from '../controllers/pastoralCare.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { scopeByChurch } from '../middlewares/scopeByChurch';
import { validate, validateParams, validateQuery } from '../middlewares/validate.middleware';
import { idParamSchema } from '../schemas/params.schema';
import {
  createPrayerRequestSchema,
  updatePrayerRequestSchema,
  updatePrayerRequestStatusSchema,
  listPrayerRequestsQuerySchema,
  createPastoralVisitSchema,
  updatePastoralVisitSchema,
  listPastoralVisitsQuerySchema,
} from '../schemas/pastoralCare.schema';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

// Prayer Requests
router.get('/prayer-requests', requireAuth, scopeByChurch(), validateQuery(listPrayerRequestsQuerySchema), asyncHandler(pastoralCareController.listPrayerRequests));
router.post('/prayer-requests', requireAuth, scopeByChurch(), validate(createPrayerRequestSchema), asyncHandler(pastoralCareController.createPrayerRequest));
router.get('/prayer-requests/:id', requireAuth, scopeByChurch(), validateParams(idParamSchema), asyncHandler(pastoralCareController.getPrayerRequest));
router.put('/prayer-requests/:id', requireAuth, scopeByChurch(), validateParams(idParamSchema), validate(updatePrayerRequestSchema), asyncHandler(pastoralCareController.updatePrayerRequest));
router.patch('/prayer-requests/:id/status', requireAuth, scopeByChurch(), validateParams(idParamSchema), validate(updatePrayerRequestStatusSchema), asyncHandler(pastoralCareController.updatePrayerRequestStatus));
router.delete('/prayer-requests/:id', requireAuth, scopeByChurch(), validateParams(idParamSchema), asyncHandler(pastoralCareController.deletePrayerRequest));

// Pastoral Visits
router.get('/visits', requireAuth, scopeByChurch(), validateQuery(listPastoralVisitsQuerySchema), asyncHandler(pastoralCareController.listPastoralVisits));
router.post('/visits', requireAuth, scopeByChurch(), validate(createPastoralVisitSchema), asyncHandler(pastoralCareController.createPastoralVisit));
router.get('/visits/:id', requireAuth, scopeByChurch(), validateParams(idParamSchema), asyncHandler(pastoralCareController.getPastoralVisit));
router.put('/visits/:id', requireAuth, scopeByChurch(), validateParams(idParamSchema), validate(updatePastoralVisitSchema), asyncHandler(pastoralCareController.updatePastoralVisit));
router.delete('/visits/:id', requireAuth, scopeByChurch(), validateParams(idParamSchema), asyncHandler(pastoralCareController.deletePastoralVisit));

export default router;
