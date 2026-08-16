import type { Request, Response } from 'express';
import type { AuthUser } from '../types/auth';
import type {
  CreateStudentInput,
  ListStudentsQuery,
  UpdateStudentInput,
} from '../schemas/student.schema';
import * as studentService from '../services/student.service';
import * as bulkImportService from '../services/bulkImport.service';
import { ok, paginated } from '../utils/apiResponse';
import { isGlobalAdmin } from '../utils/roles';
import { ForbiddenError, ValidationError } from '../utils/errors';
import { BIBLE_LESSON_TITLES } from '../constants/lessons';
import { buildExcelBuffer, parseExcelBuffer, sendExcelResponse } from '../utils/excel';

type StudentScope = { churchId: string } | { churchId: null };

function resolveChurchId(user: AuthUser): StudentScope {
  if (isGlobalAdmin(user)) {
    return { churchId: null };
  }
  if (!user.churchId) {
    throw new ForbiddenError('El usuario no está asociado a ninguna iglesia');
  }
  return { churchId: user.churchId };
}

function requireScopedChurch(user: AuthUser): string {
  const scope = resolveChurchId(user);
  if (!scope.churchId) {
    throw new ForbiddenError('Esta operación requiere estar asociado a una iglesia específica');
  }
  return scope.churchId;
}

export async function createStudent(req: Request, res: Response): Promise<void> {
  const scope = resolveChurchId(req.user!);
  if (!scope.churchId) {
    throw new ForbiddenError('No se pueden crear estudiantes desde el modo global. Especifique una iglesia.');
  }
  const student = await studentService.createStudent(scope.churchId, req.user!.id, req.body as CreateStudentInput);
  res.status(201).json(ok(student, 'Estudiante inscrito exitosamente'));
}

export async function listStudents(req: Request, res: Response): Promise<void> {
  const scope = resolveChurchId(req.user!);
  const query = req.query as unknown as ListStudentsQuery;
  const { students, total } = await studentService.listStudents(scope.churchId, query);
  res.status(200).json(paginated(students, total, query.page, query.limit));
}

export async function deleteStudent(req: Request, res: Response): Promise<void> {
  const scope = resolveChurchId(req.user!);
  await studentService.deleteStudent(scope.churchId, req.params.id);
  res.status(200).json(ok(null, 'Estudiante eliminado exitosamente'));
}

export async function deleteMultipleStudents(req: Request, res: Response): Promise<void> {
  const scope = resolveChurchId(req.user!);
  const ids = (req.body as { ids: string[] }).ids;
  await studentService.deleteMultipleStudents(scope.churchId, ids);
  res.status(200).json(ok(null, `${ids.length} estudiante(s) eliminado(s)`));
}

export async function updateStudentStatus(req: Request, res: Response): Promise<void> {
  const churchId = requireScopedChurch(req.user!);
  const student = await studentService.updateStudentStatus(
    churchId,
    req.params.id,
    req.user!.id,
    (req.body as { status: 'enrolled' | 'active' | 'completed' | 'dropped' | 'suspended' | 'graduated' }).status,
  );
  res.status(200).json(ok(student, 'Estado actualizado exitosamente'));
}

export async function updateStudentLevel(req: Request, res: Response): Promise<void> {
  const churchId = requireScopedChurch(req.user!);
  const student = await studentService.updateStudentLevel(
    churchId,
    req.params.id,
    req.user!.id,
    (req.body as { level: 'beginner' | 'intermediate' | 'advanced' | 'graduate' }).level,
  );
  res.status(200).json(ok(student, 'Nivel actualizado exitosamente'));
}

export async function getStudent(req: Request, res: Response): Promise<void> {
  const scope = resolveChurchId(req.user!);
  if (!scope.churchId) {
    throw new ForbiddenError('No se puede acceder a estudiantes desde el modo global sin especificar iglesia.');
  }
  const student = await studentService.getStudent(scope.churchId, req.params.id);
  res.status(200).json(ok(student));
}

export async function updateStudent(req: Request, res: Response): Promise<void> {
  const scope = resolveChurchId(req.user!);
  if (!scope.churchId) {
    throw new ForbiddenError('No se pueden actualizar estudiantes desde el modo global.');
  }
  const student = await studentService.updateStudent(scope.churchId, req.params.id, req.user!.id, req.body as UpdateStudentInput);
  res.status(200).json(ok(student, 'Estudiante actualizado exitosamente'));
}

export async function listLessons(_req: Request, res: Response): Promise<void> {
  res.status(200).json(ok(BIBLE_LESSON_TITLES));
}

export async function importStudentsExcel(req: Request, res: Response): Promise<void> {
  const churchId = requireScopedChurch(req.user!);
  if (!req.file) {
    throw new ValidationError('Debe adjuntar un archivo Excel');
  }
  const rows = parseExcelBuffer(req.file.buffer);
  if (rows.length === 0) {
    throw new ValidationError('El archivo Excel no contiene filas de datos');
  }
  const groupId = typeof req.body.groupId === 'string' && req.body.groupId ? req.body.groupId : undefined;
  const result = await bulkImportService.executeBulkImport(
    { entity: 'students', rows, groupId },
    churchId,
    req.user!.id,
  );
  const status = result.errors.length > 0 && result.imported === 0 ? 422 : 200;
  res
    .status(status)
    .json(ok(result, `Importación completada: ${result.imported} importados, ${result.skipped} omitidos`));
}

export async function exportStudentsExcel(req: Request, res: Response): Promise<void> {
  const scope = resolveChurchId(req.user!);
  const hasBody = req.body && Object.keys(req.body).length > 0;
  const filters = (hasBody ? req.body : req.query) as unknown as ListStudentsQuery;
  const rows = await studentService.exportStudentsToExcel(scope.churchId, filters);
  const buffer = buildExcelBuffer([{ name: 'Estudiantes', rows }]);
  sendExcelResponse(res, buffer, `estudiantes_${new Date().toISOString().slice(0, 10)}.xlsx`);
}
