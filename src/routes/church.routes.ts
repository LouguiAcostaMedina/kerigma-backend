import { Router } from 'express';
import * as churchController from '../controllers/church.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { validate, validateParams, validateQuery } from '../middlewares/validate.middleware';
import { idParamSchema } from '../schemas/params.schema';
import {
  createChurchSchema,
  listChurchesQuerySchema,
  nearbyChurchesQuerySchema,
  updateChurchSchema,
} from '../schemas/church.schema';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.get('/public', asyncHandler(churchController.listPublicChurches));

router.get('/nearby', requireAuth, validateQuery(nearbyChurchesQuerySchema), asyncHandler(churchController.listNearbyChurches));

router.get('/', requireAuth, validateQuery(listChurchesQuerySchema), asyncHandler(churchController.listChurches));

router.post('/', requireAuth, validate(createChurchSchema), asyncHandler(churchController.createChurch));
router.put('/:id', requireAuth, validateParams(idParamSchema), validate(updateChurchSchema), asyncHandler(churchController.updateChurch));
router.delete('/:id', requireAuth, validateParams(idParamSchema), asyncHandler(churchController.deleteChurch));

export default router;
