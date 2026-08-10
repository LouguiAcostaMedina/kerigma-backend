import type { Request, Response } from 'express';
import type { AuthUser } from '../types/auth';
import type { BulkImportInput } from '../schemas/bulkImport.schema';
import * as bulkImportService from '../services/bulkImport.service';
import { ok } from '../utils/apiResponse';
import { isGlobalAdmin } from '../utils/roles';
import { ForbiddenError, ValidationError } from '../utils/errors';

function resolveChurchId(user: AuthUser): string {
  if (isGlobalAdmin(user)) {
    throw new ForbiddenError('No se puede ejecutar importación masiva desde el modo global. Especifique una iglesia.');
  }
  if (!user.churchId) {
    throw new ForbiddenError('El usuario no está asociado a ninguna iglesia');
  }
  return user.churchId;
}

export async function importEntities(req: Request, res: Response): Promise<void> {
  const churchId = resolveChurchId(req.user!);
  const input = req.body as BulkImportInput;

  if (!input.rows || !Array.isArray(input.rows) || input.rows.length === 0) {
    throw new ValidationError('Debe proporcionar un array de filas para importar');
  }

  if (input.rows.length > 500) {
    throw new ValidationError('No se pueden importar más de 500 filas a la vez');
  }

  const result = await bulkImportService.executeBulkImport(input, churchId, req.user!.id);

  const status = result.errors.length > 0 && result.imported === 0 ? 422 : 200;
  res.status(status).json(ok(result, `Importación completada: ${result.imported} importados, ${result.skipped} omitidos`));
}
