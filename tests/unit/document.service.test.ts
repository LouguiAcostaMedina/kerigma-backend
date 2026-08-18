import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockDocument = {
  id: 'doc1',
  churchId: 'c1',
  title: 'Acta de reunión',
  description: 'Acta mensual',
  category: 'report' as const,
  fileUrl: '/files/acta.pdf',
  fileName: 'acta.pdf',
  fileSize: 1024,
  mimeType: 'application/pdf',
  memberId: 'mem1',
  groupId: null,
  isPublic: false,
  uploadedBy: 'u1',
  uploader: { firstName: 'Ana', lastName: 'Torres' },
  createdAt: new Date('2024-01-15'),
  update: vi.fn(),
  destroy: vi.fn(),
};

const mockDb = vi.hoisted(() => ({
  ChurchDocument: {
    findByPk: vi.fn(),
    findAndCountAll: vi.fn(),
    create: vi.fn(),
    destroy: vi.fn(),
  },
  User: {
    findOne: vi.fn(),
  },
}));

vi.mock('../../src/models', () => ({ db: mockDb }));

import * as documentService from '../../src/services/document.service';

describe('document.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDocument.update.mockReset();
    mockDocument.destroy.mockReset();
  });

  describe('listDocuments', () => {
    it('returns paginated documents', async () => {
      mockDb.ChurchDocument.findAndCountAll.mockResolvedValue({
        rows: [mockDocument],
        count: 1,
      });

      const result = await documentService.listDocuments('c1', {
        page: 1,
        limit: 10,
      });

      expect(result.documents).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.documents[0].title).toBe('Acta de reunión');
      expect(result.documents[0].uploaderName).toBe('Ana Torres');
    });
  });

  describe('getDocument', () => {
    it('returns by id', async () => {
      mockDb.ChurchDocument.findByPk.mockResolvedValue(mockDocument);

      const result = await documentService.getDocument('doc1');

      expect(result.id).toBe('doc1');
      expect(result.title).toBe('Acta de reunión');
    });

    it('throws NotFoundError', async () => {
      mockDb.ChurchDocument.findByPk.mockResolvedValue(null);

      await expect(documentService.getDocument('nonexistent'))
        .rejects.toThrow('Documento no encontrado');
    });
  });

  describe('createDocument', () => {
    it('creates with defaults (isPublic: false)', async () => {
      mockDb.ChurchDocument.create.mockResolvedValue(mockDocument);
      mockDb.ChurchDocument.findByPk.mockResolvedValue(mockDocument);

      const result = await documentService.createDocument('c1', 'u1', {
        title: 'Acta de reunión',
        category: 'report',
        fileUrl: '/files/acta.pdf',
        fileName: 'acta.pdf',
      });

      expect(result.title).toBe('Acta de reunión');
      expect(mockDb.ChurchDocument.create).toHaveBeenCalledWith(
        expect.objectContaining({
          isPublic: false,
        }),
      );
    });
  });

  describe('updateDocument', () => {
    it('updates fields', async () => {
      const fresh = { ...mockDocument };
      mockDb.ChurchDocument.findByPk
        .mockResolvedValueOnce(fresh)
        .mockResolvedValueOnce({ ...fresh, title: 'Acta actualizada' });

      const result = await documentService.updateDocument('doc1', {
        title: 'Acta actualizada',
      });

      expect(fresh.update).toHaveBeenCalled();
      expect(result.title).toBe('Acta actualizada');
    });
  });

  describe('deleteDocument', () => {
    it('deletes', async () => {
      mockDb.ChurchDocument.findByPk.mockResolvedValue({ ...mockDocument });

      await documentService.deleteDocument('doc1');

      expect(mockDocument.destroy).toHaveBeenCalled();
    });
  });
});
