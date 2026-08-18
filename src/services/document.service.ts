import { Op, type WhereOptions } from 'sequelize';
import { db } from '../models';
import type { ChurchDocument, DocumentCategory } from '../models/ChurchDocument.model';
import { NotFoundError } from '../utils/errors';

export interface ChurchDocumentSummary {
  id: string;
  churchId: string;
  title: string;
  description: string | null;
  category: DocumentCategory;
  fileUrl: string;
  fileName: string;
  fileSize: number | null;
  mimeType: string | null;
  memberId: string | null;
  groupId: string | null;
  isPublic: boolean;
  uploadedBy: string;
  uploaderName: string | null;
  createdAt: Date;
}

export interface DocumentsPaginatedResult {
  documents: ChurchDocumentSummary[];
  total: number;
}

export interface ListDocumentsQuery {
  page: number;
  limit: number;
  search?: string;
  category?: DocumentCategory;
  memberId?: string;
  isPublic?: boolean;
}

export interface CreateDocumentInput {
  title: string;
  description?: string;
  category: DocumentCategory;
  fileUrl: string;
  fileName: string;
  fileSize?: number;
  mimeType?: string;
  memberId?: string;
  groupId?: string;
  isPublic?: boolean;
}

export interface UpdateDocumentInput {
  title?: string;
  description?: string | null;
  category?: DocumentCategory;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number | null;
  mimeType?: string | null;
  memberId?: string | null;
  groupId?: string | null;
  isPublic?: boolean;
}

function toDocumentSummary(document: ChurchDocument): ChurchDocumentSummary {
  const uploader = document.uploader as { firstName: string; lastName: string } | undefined;
  return {
    id: document.id,
    churchId: document.churchId,
    title: document.title,
    description: document.description,
    category: document.category,
    fileUrl: document.fileUrl,
    fileName: document.fileName,
    fileSize: document.fileSize,
    mimeType: document.mimeType,
    memberId: document.memberId,
    groupId: document.groupId,
    isPublic: document.isPublic,
    uploadedBy: document.uploadedBy,
    uploaderName: uploader ? `${uploader.firstName} ${uploader.lastName}` : null,
    createdAt: document.createdAt,
  };
}

const DOCUMENT_INCLUDES = [
  { model: db.User, as: 'uploader', attributes: ['id', 'firstName', 'lastName'] },
];

export async function listDocuments(
  churchId: string,
  query: ListDocumentsQuery,
): Promise<DocumentsPaginatedResult> {
  const { page, limit, search, category, memberId, isPublic } = query;

  const where: WhereOptions = { churchId };
  if (category) {
    (where as Record<string, unknown>).category = category;
  }
  if (memberId) {
    (where as Record<string, unknown>).memberId = memberId;
  }
  if (isPublic !== undefined) {
    (where as Record<string, unknown>).isPublic = isPublic;
  }
  if (search) {
    const term = `%${search}%`;
    (where as Record<string | symbol, unknown>)[Op.or] = [
      { title: { [Op.iLike]: term } },
      { description: { [Op.iLike]: term } },
      { fileName: { [Op.iLike]: term } },
    ];
  }

  const { rows, count } = await db.ChurchDocument.findAndCountAll({
    where,
    include: DOCUMENT_INCLUDES,
    order: [['createdAt', 'DESC']],
    limit,
    offset: (page - 1) * limit,
    subQuery: false,
  });

  return { documents: rows.map(toDocumentSummary), total: count };
}

export async function getDocument(id: string): Promise<ChurchDocumentSummary> {
  const document = await db.ChurchDocument.findByPk(id, {
    include: DOCUMENT_INCLUDES,
  });
  if (!document) {
    throw new NotFoundError('Documento no encontrado');
  }
  return toDocumentSummary(document);
}

export async function createDocument(
  churchId: string,
  userId: string,
  input: CreateDocumentInput,
): Promise<ChurchDocumentSummary> {
  const document = await db.ChurchDocument.create({
    churchId,
    title: input.title,
    description: input.description ?? null,
    category: input.category,
    fileUrl: input.fileUrl,
    fileName: input.fileName,
    fileSize: input.fileSize ?? null,
    mimeType: input.mimeType ?? null,
    memberId: input.memberId ?? null,
    groupId: input.groupId ?? null,
    isPublic: input.isPublic ?? false,
    uploadedBy: userId,
  });

  return getDocument(document.id);
}

export async function updateDocument(
  id: string,
  input: UpdateDocumentInput,
): Promise<ChurchDocumentSummary> {
  const document = await db.ChurchDocument.findByPk(id);
  if (!document) {
    throw new NotFoundError('Documento no encontrado');
  }

  await document.update({
    title: input.title ?? document.title,
    description: input.description !== undefined ? input.description : document.description,
    category: input.category ?? document.category,
    fileUrl: input.fileUrl ?? document.fileUrl,
    fileName: input.fileName ?? document.fileName,
    fileSize: input.fileSize !== undefined ? input.fileSize : document.fileSize,
    mimeType: input.mimeType !== undefined ? input.mimeType : document.mimeType,
    memberId: input.memberId !== undefined ? input.memberId : document.memberId,
    groupId: input.groupId !== undefined ? input.groupId : document.groupId,
    isPublic: input.isPublic ?? document.isPublic,
  });

  return getDocument(id);
}

export async function deleteDocument(id: string): Promise<void> {
  const document = await db.ChurchDocument.findByPk(id);
  if (!document) {
    throw new NotFoundError('Documento no encontrado');
  }
  await document.destroy();
}
