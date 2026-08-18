import { Router } from 'express';
import * as documentController from '../controllers/document.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { scopeByChurch } from '../middlewares/scopeByChurch';
import { validate, validateParams, validateQuery } from '../middlewares/validate.middleware';
import { idParamSchema } from '../schemas/params.schema';
import {
  createDocumentSchema,
  updateDocumentSchema,
  listDocumentsQuerySchema,
} from '../schemas/document.schema';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.get('/', requireAuth, scopeByChurch(), validateQuery(listDocumentsQuerySchema), asyncHandler(documentController.listDocuments));
router.post('/', requireAuth, scopeByChurch(), validate(createDocumentSchema), asyncHandler(documentController.createDocument));
router.get('/:id', requireAuth, scopeByChurch(), validateParams(idParamSchema), asyncHandler(documentController.getDocument));
router.put('/:id', requireAuth, scopeByChurch(), validateParams(idParamSchema), validate(updateDocumentSchema), asyncHandler(documentController.updateDocument));
router.delete('/:id', requireAuth, scopeByChurch(), validateParams(idParamSchema), asyncHandler(documentController.deleteDocument));

export default router;
