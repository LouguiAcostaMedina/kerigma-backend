import type { Request, Response } from 'express';
import type { AuthUser } from '../types/auth';
import type {
  CreateDocumentInput,
  ListDocumentsQuery,
  UpdateDocumentInput,
} from '../schemas/document.schema';
import * as documentService from '../services/document.service';
import { ok, paginated } from '../utils/apiResponse';
import { isGlobalAdmin } from '../utils/roles';
import { ForbiddenError } from '../utils/errors';

type ChurchScope = { churchId: string } | { churchId: null };

function resolveChurchScope(user: AuthUser): ChurchScope {
  if (isGlobalAdmin(user)) {
    return { churchId: null };
  }
  if (!user.churchId) {
    throw new ForbiddenError('El usuario no está asociado a ninguna iglesia');
  }
  return { churchId: user.churchId };
}

export async function listDocuments(req: Request, res: Response): Promise<void> {
  const scope = resolveChurchScope(req.user!);
  if (!scope.churchId) {
    throw new ForbiddenError('No se pueden listar documentos desde el modo global');
  }
  const query = req.query as unknown as ListDocumentsQuery;
  const { documents, total } = await documentService.listDocuments(scope.churchId, query);
  res.status(200).json(paginated(documents, total, query.page, query.limit));
}

export async function getDocument(req: Request, res: Response): Promise<void> {
  resolveChurchScope(req.user!);
  const document = await documentService.getDocument(req.params.id);
  res.status(200).json(ok(document));
}

export async function createDocument(req: Request, res: Response): Promise<void> {
  const scope = resolveChurchScope(req.user!);
  if (!scope.churchId) {
    throw new ForbiddenError('No se pueden crear documentos desde el modo global. Especifique una iglesia.');
  }
  const document = await documentService.createDocument(
    scope.churchId,
    req.user!.id,
    req.body as CreateDocumentInput,
  );
  res.status(201).json(ok(document, 'Documento creado exitosamente'));
}

export async function updateDocument(req: Request, res: Response): Promise<void> {
  resolveChurchScope(req.user!);
  const document = await documentService.updateDocument(
    req.params.id,
    req.body as UpdateDocumentInput,
  );
  res.status(200).json(ok(document, 'Documento actualizado exitosamente'));
}

export async function deleteDocument(req: Request, res: Response): Promise<void> {
  resolveChurchScope(req.user!);
  await documentService.deleteDocument(req.params.id);
  res.status(200).json(ok(null, 'Documento eliminado exitosamente'));
}
