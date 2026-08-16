import { Router } from 'express';
import * as studentController from '../controllers/student.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { scopeByChurch } from '../middlewares/scopeByChurch';
import { validate, validateParams, validateQuery } from '../middlewares/validate.middleware';
import { idParamSchema } from '../schemas/params.schema';
import {
  bulkDeleteStudentsSchema,
  createStudentSchema,
  listStudentsQuerySchema,
  updateStudentLevelSchema,
  updateStudentSchema,
  updateStudentStatusSchema,
} from '../schemas/student.schema';
import { asyncHandler } from '../utils/asyncHandler';
import { excelUpload } from '../utils/upload';

const router = Router();

router.get('/', requireAuth, scopeByChurch(), validateQuery(listStudentsQuerySchema), asyncHandler(studentController.listStudents));
router.get('/lessons', requireAuth, scopeByChurch(), asyncHandler(studentController.listLessons));
router.post('/import/excel', requireAuth, scopeByChurch(), excelUpload.single('file'), asyncHandler(studentController.importStudentsExcel));
router.post('/export/excel', requireAuth, scopeByChurch(), asyncHandler(studentController.exportStudentsExcel));

router.post('/', requireAuth, scopeByChurch(), validate(createStudentSchema), asyncHandler(studentController.createStudent));
router.patch(
  '/:id/status',
  requireAuth,
  scopeByChurch(),
  validateParams(idParamSchema),
  validate(updateStudentStatusSchema),
  asyncHandler(studentController.updateStudentStatus),
);
router.patch(
  '/:id/level',
  requireAuth,
  scopeByChurch(),
  validateParams(idParamSchema),
  validate(updateStudentLevelSchema),
  asyncHandler(studentController.updateStudentLevel),
);
router.delete('/bulk', requireAuth, scopeByChurch(), validate(bulkDeleteStudentsSchema), asyncHandler(studentController.deleteMultipleStudents));
router.get('/:id', requireAuth, scopeByChurch(), validateParams(idParamSchema), asyncHandler(studentController.getStudent));
router.put('/:id', requireAuth, scopeByChurch(), validateParams(idParamSchema), validate(updateStudentSchema), asyncHandler(studentController.updateStudent));
router.delete('/:id', requireAuth, scopeByChurch(), validateParams(idParamSchema), asyncHandler(studentController.deleteStudent));

export default router;
