import { Router } from 'express';
import * as bulkImportController from '../controllers/bulkImport.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.post('/', requireAuth, asyncHandler(bulkImportController.importEntities));

export default router;
