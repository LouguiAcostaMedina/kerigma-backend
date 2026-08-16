import { Router } from 'express';
import * as catalogController from '../controllers/catalog.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { validateParams } from '../middlewares/validate.middleware';
import { nameParamSchema } from '../schemas/params.schema';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.get('/', requireAuth, asyncHandler(catalogController.getFullCatalog));
router.get('/:name', requireAuth, validateParams(nameParamSchema), asyncHandler(catalogController.getCatalogByName));

export default router;
