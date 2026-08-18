import { Router } from 'express';
import * as baptismPipelineController from '../controllers/baptismPipeline.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { scopeByChurch } from '../middlewares/scopeByChurch';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.get('/metrics', requireAuth, scopeByChurch(), asyncHandler(baptismPipelineController.getPipelineMetrics));
router.get('/lesson-stats', requireAuth, scopeByChurch(), asyncHandler(baptismPipelineController.getLessonCompletionStats));

export default router;
