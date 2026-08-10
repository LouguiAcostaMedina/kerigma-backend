import { Router } from 'express';
import * as studentController from '../controllers/student.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { validate, validateQuery } from '../middlewares/validate.middleware';
import {
  bulkDeleteStudentsSchema,
  createStudentSchema,
  listStudentsQuerySchema,
  updateLessonsSchema,
  updateStudentLevelSchema,
  updateStudentSchema,
  updateStudentStatusSchema,
} from '../schemas/student.schema';
import { asyncHandler } from '../utils/asyncHandler';
import { excelUpload } from '../utils/upload';

const router = Router();

router.get('/', requireAuth, validateQuery(listStudentsQuerySchema), asyncHandler(studentController.listStudents));
router.get('/stats', requireAuth, asyncHandler(studentController.getStudentsStats));
router.get('/group/:groupId', requireAuth, asyncHandler(studentController.listStudentsByGroup));
router.get('/lessons', requireAuth, asyncHandler(studentController.listLessons));
router.get('/export/excel', requireAuth, asyncHandler(studentController.exportStudentsExcel));
router.get('/export/pdf', requireAuth, asyncHandler(studentController.exportStudentsExcel));
router.post('/import/excel', requireAuth, excelUpload.single('file'), asyncHandler(studentController.importStudentsExcel));
router.post('/export/excel', requireAuth, asyncHandler(studentController.exportStudentsExcel));

router.post('/', requireAuth, validate(createStudentSchema), asyncHandler(studentController.createStudent));
router.put(
  '/:id/lessons',
  requireAuth,
  validate(updateLessonsSchema),
  asyncHandler(studentController.updateStudentLessons),
);
router.patch(
  '/:id/status',
  requireAuth,
  validate(updateStudentStatusSchema),
  asyncHandler(studentController.updateStudentStatus),
);
router.patch(
  '/:id/level',
  requireAuth,
  validate(updateStudentLevelSchema),
  asyncHandler(studentController.updateStudentLevel),
);
router.delete('/bulk', requireAuth, validate(bulkDeleteStudentsSchema), asyncHandler(studentController.deleteMultipleStudents));
router.get('/:id', requireAuth, asyncHandler(studentController.getStudent));
router.put('/:id', requireAuth, validate(updateStudentSchema), asyncHandler(studentController.updateStudent));
router.delete('/:id', requireAuth, asyncHandler(studentController.deleteStudent));

export default router;
