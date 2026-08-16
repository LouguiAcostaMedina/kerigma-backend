import { describe, expect, it, vi } from 'vitest';
import type { NextFunction, Request, Response } from 'express';
import type { ZodType } from 'zod';
import { validateParams } from '../../src/middlewares/validate.middleware';
import { idParamSchema, groupIdParamSchema } from '../../src/schemas/params.schema';

function makeReq(partial: Partial<Request>): Request {
  return partial as Request;
}

function run(next: NextFunction, schema: ZodType = idParamSchema) {
  const handler = validateParams(schema);
  return (req: Request) => {
    const res = {} as Response;
    handler(req, res, next);
  };
}

describe('validateParams', () => {
  it('acepta un id UUID válido y lo deja en req.params', () => {
    const next = vi.fn();
    const req = makeReq({ params: { id: '550e8400-e29b-41d4-a716-446655440000' } });

    run(next)(req);

    expect(next).toHaveBeenCalledOnce();
    expect(next).toHaveBeenCalledWith();
  });

  it('rechaza un id no UUID con ValidationError', () => {
    const next = vi.fn();
    const req = makeReq({ params: { id: 'abc' } });

    run(next)(req);

    expect(next).toHaveBeenCalledOnce();
    const [error] = next.mock.calls[0] as [Error];
    expect(error).toBeInstanceOf(Error);
    expect((error as { status?: number }).status ?? 400).toBe(400);
    expect(error.message).toBe('Parámetros de ruta inválidos');
  });

  it('valida nombres de parámetro específicos (groupId)', () => {
    const next = vi.fn();
    const req = makeReq({ params: { groupId: '550e8400-e29b-41d4-a716-446655440001' } });

    run(next, groupIdParamSchema)(req);

    expect(next).toHaveBeenCalledOnce();
  });

  it('rechaza cuando el parámetro esperado no coincide con el nombre', () => {
    const next = vi.fn();
    const req = makeReq({ params: { id: '550e8400-e29b-41d4-a716-446655440000' } });

    run(next, groupIdParamSchema)(req);

    expect(next).toHaveBeenCalledOnce();
    const [error] = next.mock.calls[0] as [Error];
    expect(error.message).toBe('Parámetros de ruta inválidos');
  });
});
