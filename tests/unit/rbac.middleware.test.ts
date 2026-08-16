import { describe, expect, it, vi } from 'vitest';
import type { NextFunction, Request, Response } from 'express';
import { requirePermission, requireRole } from '../../src/middlewares/rbac.middleware';
import type { AuthUser } from '../../src/types/auth';

function makeReq(user: AuthUser | undefined): Request {
  return { user } as Request;
}

function run(
  middleware: (req: Request, res: Response, next: NextFunction) => void,
  req: Request,
): { status: number | null; next: NextFunction } {
  const res = {
    statusCode: 200,
    status: (code: number) => {
      (res as Response).statusCode = code;
      return res;
    },
  } as Response;
  const captured = { status: null as number | null };
  const next = vi.fn((error?: unknown) => {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      captured.status = (error as { statusCode: number }).statusCode;
    }
    return error as never;
  }) as unknown as NextFunction;

  middleware(req, res, next);
  return { status: captured.status, next };
}

const leader: AuthUser = { id: 'u1', email: 'lider@test.com', role: 'leader', churchId: 'c1', firstName: 'A', lastName: 'B' };
const reader: AuthUser = { id: 'u2', email: 'reader@test.com', role: 'reader', churchId: 'c1', firstName: 'A', lastName: 'B' };
const director: AuthUser = { id: 'u3', email: 'dir@test.com', role: 'director', churchId: 'c1', firstName: 'A', lastName: 'B' };

describe('requireRole', () => {
  it('permite el paso cuando el rol está en la lista', () => {
    const { status, next } = run(requireRole('admin', 'director'), makeReq(director));
    expect(status).toBeNull();
    expect(next).toHaveBeenCalledOnce();
    expect(next).toHaveBeenCalledWith();
  });

  it('bloquea con 403 cuando el rol no está en la lista', () => {
    const { status, next } = run(requireRole('super_admin', 'admin'), makeReq(leader));
    expect(status).toBe(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('bloquea con 401 si no hay usuario autenticado', () => {
    const { status } = run(requireRole('admin'), makeReq(undefined));
    expect(status).toBe(401);
  });
});

describe('requirePermission', () => {
  it('otorga a director el permiso users.create', () => {
    const { status, next } = run(requirePermission('users.create'), makeReq(director));
    expect(status).toBeNull();
    expect(next).toHaveBeenCalledOnce();
  });

  it('deniega a reader el permiso members.update', () => {
    const { status } = run(requirePermission('members.update'), makeReq(reader));
    expect(status).toBe(403);
  });

  it('otorga a reader el permiso members.read', () => {
    const { status } = run(requirePermission('members.read'), makeReq(reader));
    expect(status).toBeNull();
  });

  it('interpreta wildcards por módulo (groups.* otorga groups.update)', () => {
    const { status } = run(requirePermission('groups.update'), makeReq(leader));
    expect(status).toBeNull();
  });

  it('interpreta wildcard global * (super_admin/admin)', () => {
    const superAdmin: AuthUser = { ...reader, role: 'super_admin' };
    const { status } = run(requirePermission('churches.delete'), makeReq(superAdmin));
    expect(status).toBeNull();
  });

  it('bloquea wildcard cruzado (members.* no otorga users.delete)', () => {
    const { status } = run(requirePermission('users.delete'), makeReq(leader));
    expect(status).toBe(403);
  });
});
