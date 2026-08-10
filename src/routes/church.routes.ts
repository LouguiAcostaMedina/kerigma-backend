import { Router } from 'express';
import * as churchController from '../controllers/church.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { validate, validateQuery } from '../middlewares/validate.middleware';
import {
  bulkDeleteChurchesSchema,
  createChurchSchema,
  listChurchesQuerySchema,
  updateChurchSchema,
  updateChurchStatusSchema,
} from '../schemas/church.schema';
import { asyncHandler } from '../utils/asyncHandler';
import { excelUpload } from '../utils/upload';

const router = Router();

router.get('/public', asyncHandler(churchController.listPublicChurches));

router.get('/', requireAuth, validateQuery(listChurchesQuerySchema), asyncHandler(churchController.listChurches));
router.get('/stats', requireAuth, asyncHandler(churchController.getChurchesStats));

router.post('/', requireAuth, validate(createChurchSchema), asyncHandler(churchController.createChurch));
router.patch(
  '/:id/status',
  requireAuth,
  validate(updateChurchStatusSchema),
  asyncHandler(churchController.updateChurchStatus),
);
router.get('/:id/statistics', requireAuth, asyncHandler(churchController.getChurchStatistics));
router.post('/:id/import', requireAuth, excelUpload.single('file'), asyncHandler(churchController.importChurchExcel));
router.post('/:id/export/excel', requireAuth, asyncHandler(churchController.exportChurchExcel));
router.delete('/bulk', requireAuth, validate(bulkDeleteChurchesSchema), asyncHandler(churchController.deleteMultipleChurches));
router.get('/:id', requireAuth, asyncHandler(churchController.getChurch));
router.put('/:id', requireAuth, validate(updateChurchSchema), asyncHandler(churchController.updateChurch));
router.delete('/:id', requireAuth, asyncHandler(churchController.deleteChurch));

export default router;
