import { Router } from 'express';
import * as hierarchyController from '../controllers/hierarchy.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/rbac.middleware';
import { validate, validateParams, validateQuery } from '../middlewares/validate.middleware';
import { idParamSchema } from '../schemas/params.schema';
import {
  createAssociationSchema,
  updateAssociationSchema,
  listAssociationsQuerySchema,
  createDistrictSchema,
  updateDistrictSchema,
  listDistrictsQuerySchema,
} from '../schemas/hierarchy.schema';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

// Associations (solo admin/super_admin)
router.get('/', requireAuth, requireRole('super_admin', 'admin'), validateQuery(listAssociationsQuerySchema), asyncHandler(hierarchyController.listAssociations));
router.post('/', requireAuth, requireRole('super_admin', 'admin'), validate(createAssociationSchema), asyncHandler(hierarchyController.createAssociation));
router.get('/:id', requireAuth, requireRole('super_admin', 'admin'), validateParams(idParamSchema), asyncHandler(hierarchyController.getAssociation));
router.put('/:id', requireAuth, requireRole('super_admin', 'admin'), validateParams(idParamSchema), validate(updateAssociationSchema), asyncHandler(hierarchyController.updateAssociation));
router.delete('/:id', requireAuth, requireRole('super_admin', 'admin'), validateParams(idParamSchema), asyncHandler(hierarchyController.deleteAssociation));

// Districts
router.get('/districts', requireAuth, requireRole('super_admin', 'admin'), validateQuery(listDistrictsQuerySchema), asyncHandler(hierarchyController.listDistricts));
router.post('/districts', requireAuth, requireRole('super_admin', 'admin'), validate(createDistrictSchema), asyncHandler(hierarchyController.createDistrict));
router.get('/districts/:id', requireAuth, requireRole('super_admin', 'admin'), validateParams(idParamSchema), asyncHandler(hierarchyController.getDistrict));
router.put('/districts/:id', requireAuth, requireRole('super_admin', 'admin'), validateParams(idParamSchema), validate(updateDistrictSchema), asyncHandler(hierarchyController.updateDistrict));
router.delete('/districts/:id', requireAuth, requireRole('super_admin', 'admin'), validateParams(idParamSchema), asyncHandler(hierarchyController.deleteDistrict));

export default router;
