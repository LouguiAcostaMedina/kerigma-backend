import { beforeEach, describe, expect, it, vi } from 'vitest';
import { audit } from '../../src/middlewares/audit.middleware';
import * as auditService from '../../src/services/audit.service';
import type { Request, Response } from 'express';

vi.mock('../../src/services/audit.service', () => ({
  recordAuditAsync: vi.fn(),
  sanitizeChanges: vi.fn((changes: unknown) => changes),
}));

function fakeReq(overrides: Partial<Request> = {}): Request {
  return {
    method: 'POST',
    baseUrl: '/api/v1/members',
    path: '/',
    params: {},
    body: { name: 'Test' },
    user: { id: 'u1', role: 'admin' },
    ...overrides,
  } as unknown as Request;
}

function fakeRes(statusCode = 200): Response {
  const res = {
    statusCode,
    on: vi.fn((_event: string, _cb: () => void) => {}),
  } as unknown as Response;
  return res;
}

describe('audit middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls next()', () => {
    const next = vi.fn();
    audit()(fakeReq(), fakeRes(), next);
    expect(next).toHaveBeenCalledOnce();
  });

  it('registers finish listener on response', () => {
    const res = fakeRes();
    const next = vi.fn();
    audit()(fakeReq(), res, next);
    expect(res.on).toHaveBeenCalledWith('finish', expect.any(Function));
  });

  it('calls recordAuditAsync on successful POST with 2xx', () => {
    const next = vi.fn();
    const res = fakeRes(201);
    audit()(fakeReq({ method: 'POST' }), res, next);

    const finishCb = (res.on as ReturnType<typeof vi.fn>).mock.calls[0][1];
    finishCb();

    expect(auditService.recordAuditAsync).toHaveBeenCalledOnce();
    expect(auditService.recordAuditAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: 'u1',
        action: 'create',
      }),
    );
  });

  it('maps PUT to update action', () => {
    const next = vi.fn();
    const res = fakeRes(200);
    audit()(fakeReq({ method: 'PUT' }), res, next);

    const finishCb = (res.on as ReturnType<typeof vi.fn>).mock.calls[0][1];
    finishCb();

    expect(auditService.recordAuditAsync).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'update' }),
    );
  });

  it('maps PATCH to update action', () => {
    const next = vi.fn();
    const res = fakeRes(200);
    audit()(fakeReq({ method: 'PATCH' }), res, next);

    const finishCb = (res.on as ReturnType<typeof vi.fn>).mock.calls[0][1];
    finishCb();

    expect(auditService.recordAuditAsync).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'update' }),
    );
  });

  it('maps DELETE to delete action', () => {
    const next = vi.fn();
    const res = fakeRes(200);
    audit()(fakeReq({ method: 'DELETE' }), res, next);

    const finishCb = (res.on as ReturnType<typeof vi.fn>).mock.calls[0][1];
    finishCb();

    expect(auditService.recordAuditAsync).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'delete' }),
    );
  });

  it('does NOT record audit for GET requests', () => {
    const next = vi.fn();
    const res = fakeRes(200);
    audit()(fakeReq({ method: 'GET' }), res, next);

    const finishCb = (res.on as ReturnType<typeof vi.fn>).mock.calls[0][1];
    finishCb();

    expect(auditService.recordAuditAsync).not.toHaveBeenCalled();
  });

  it('does NOT record audit for non-2xx status codes', () => {
    const next = vi.fn();
    const res = fakeRes(400);
    audit()(fakeReq({ method: 'POST' }), res, next);

    const finishCb = (res.on as ReturnType<typeof vi.fn>).mock.calls[0][1];
    finishCb();

    expect(auditService.recordAuditAsync).not.toHaveBeenCalled();
  });

  it('does NOT record audit when req.user is missing', () => {
    const next = vi.fn();
    const res = fakeRes(201);
    audit()(fakeReq({ user: undefined }), res, next);

    const finishCb = (res.on as ReturnType<typeof vi.fn>).mock.calls[0][1];
    finishCb();

    expect(auditService.recordAuditAsync).not.toHaveBeenCalled();
  });

  it('does NOT record audit for excluded paths (/auth/)', () => {
    const next = vi.fn();
    const res = fakeRes(201);
    audit()(fakeReq({ baseUrl: '/auth', path: '/login' }), res, next);

    const finishCb = (res.on as ReturnType<typeof vi.fn>).mock.calls[0][1];
    finishCb();

    expect(auditService.recordAuditAsync).not.toHaveBeenCalled();
  });

  it('does NOT record audit for excluded paths (/import/)', () => {
    const next = vi.fn();
    const res = fakeRes(200);
    audit()(fakeReq({ baseUrl: '/import', path: '/bulk' }), res, next);

    const finishCb = (res.on as ReturnType<typeof vi.fn>).mock.calls[0][1];
    finishCb();

    expect(auditService.recordAuditAsync).not.toHaveBeenCalled();
  });

  it('extracts entityId from req.params.id', () => {
    const next = vi.fn();
    const res = fakeRes(200);
    audit()(fakeReq({ method: 'PUT', params: { id: '42' } }), res, next);

    const finishCb = (res.on as ReturnType<typeof vi.fn>).mock.calls[0][1];
    finishCb();

    expect(auditService.recordAuditAsync).toHaveBeenCalledWith(
      expect.objectContaining({ entityId: '42' }),
    );
  });

  it('extracts entityId from req.params.memberId', () => {
    const next = vi.fn();
    const res = fakeRes(200);
    audit()(fakeReq({ method: 'PUT', params: { memberId: '77' } }), res, next);

    const finishCb = (res.on as ReturnType<typeof vi.fn>).mock.calls[0][1];
    finishCb();

    expect(auditService.recordAuditAsync).toHaveBeenCalledWith(
      expect.objectContaining({ entityId: '77' }),
    );
  });

  it('PATCH with entityId maps action to status_change', () => {
    const next = vi.fn();
    const res = fakeRes(200);
    audit()(fakeReq({ method: 'PATCH', params: { id: '99' } }), res, next);

    const finishCb = (res.on as ReturnType<typeof vi.fn>).mock.calls[0][1];
    finishCb();

    expect(auditService.recordAuditAsync).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'status_change', entityId: '99' }),
    );
  });

  it('PATCH without entityId maps to update action', () => {
    const next = vi.fn();
    const res = fakeRes(200);
    audit()(fakeReq({ method: 'PATCH', params: {} }), res, next);

    const finishCb = (res.on as ReturnType<typeof vi.fn>).mock.calls[0][1];
    finishCb();

    expect(auditService.recordAuditAsync).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'update', entityId: '' }),
    );
  });

  it('supports custom excludePaths option', () => {
    const next = vi.fn();
    const res = fakeRes(201);
    audit({ excludePaths: [/^\/custom\//] })(fakeReq({ baseUrl: '', path: '/custom/test' }), res, next);

    const finishCb = (res.on as ReturnType<typeof vi.fn>).mock.calls[0][1];
    finishCb();

    expect(auditService.recordAuditAsync).not.toHaveBeenCalled();
  });
});
