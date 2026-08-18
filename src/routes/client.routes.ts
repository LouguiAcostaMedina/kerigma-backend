import { Router } from 'express';
import * as clientController from '../controllers/client.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/rbac.middleware';
import { validate, validateParams, validateQuery } from '../middlewares/validate.middleware';
import { idParamSchema } from '../schemas/params.schema';
import {
  createClientSchema,
  listClientsQuerySchema,
  slugParamSchema,
  updateClientSchema,
} from '../schemas/client.schema';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

const superAdminOnly = requireRole('super_admin');

router.get('/slug/:slug', validateParams(slugParamSchema), asyncHandler(clientController.getClientBySlug));

router.get('/', requireAuth, superAdminOnly, validateQuery(listClientsQuerySchema), asyncHandler(clientController.listClients));

router.get('/:id', requireAuth, superAdminOnly, validateParams(idParamSchema), asyncHandler(clientController.getClient));

router.post('/', requireAuth, superAdminOnly, validate(createClientSchema), asyncHandler(clientController.createClient));

router.put('/:id', requireAuth, superAdminOnly, validateParams(idParamSchema), validate(updateClientSchema), asyncHandler(clientController.updateClient));

router.delete('/:id', requireAuth, superAdminOnly, validateParams(idParamSchema), asyncHandler(clientController.deleteClient));

export default router;
