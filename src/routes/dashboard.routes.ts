import { Router } from 'express';
import * as dashboardController from '../controllers/dashboard.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { scopeByChurch } from '../middlewares/scopeByChurch';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

// scopeByChurch: permite acceso global al SuperAdmin y bloquea (403)
// a cualquier otro usuario sin iglesia asignada o con churchId ajeno.
router.get('/spiritual-health', requireAuth, scopeByChurch(), asyncHandler(dashboardController.getSpiritualHealth));
router.get('/kpis', requireAuth, scopeByChurch(), asyncHandler(dashboardController.getDashboardKpis));

export default router;
