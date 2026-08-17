import { Router } from 'express';
import * as bulkImportController from '../controllers/bulkImport.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/rbac.middleware';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.post('/', requireAuth, requireRole('super_admin', 'admin'), asyncHandler(bulkImportController.importEntities));

export default router;
