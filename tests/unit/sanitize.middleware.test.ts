import { describe, expect, it, vi } from 'vitest';
import type { NextFunction, Request, Response } from 'express';
import { sanitizeRequest } from '../../src/middlewares/sanitize.middleware';

function makeReq(partial: Partial<Request>): Request {
  return partial as Request;
}

function runSanitize(req: Request): { next: NextFunction } {
  const res = {} as Response;
  const next = vi.fn() as unknown as NextFunction;
  sanitizeRequest(req, res, next);
  return { next };
}

describe('sanitizeRequest (control chars + trim)', () => {
  it('elimina caracteres de control y recorta espacios en strings', () => {
    const req = makeReq({
      body: { name: '  Juan\u0000D\u007Fiaz  ', note: 'a\u0001b\u0002c' },
      query: {},
      params: {},
    });

    const { next } = runSanitize(req);

    expect(req.body).toEqual({ name: 'JuanDiaz', note: 'abc' });
    expect(next).toHaveBeenCalledOnce();
  });

  it('recorre de forma recursiva arrays y objetos anidados', () => {
    const req = makeReq({
      body: {
        members: [
          { name: '\u0007Ana  ' },
          { name: '  Luis\u0000', tags: ['\u001Bx', 'y'] },
        ],
      },
      query: {},
      params: {},
    });

    runSanitize(req);

    expect(req.body).toEqual({
      members: [
        { name: 'Ana' },
        { name: 'Luis', tags: ['x', 'y'] },
      ],
    });
  });

  it('sanea también query y params', () => {
    const req = makeReq({
      body: {},
      query: { churchId: '  iglesia-a\u0000 ', term: 'a\u001Fb' },
      params: { id: '\u0000groupId-1' },
    });

    runSanitize(req);

    expect(req.query).toEqual({ churchId: 'iglesia-a', term: 'ab' });
    expect(req.params).toEqual({ id: 'groupId-1' });
  });

  it('deja pasar valores no-string sin alterarlos', () => {
    const req = makeReq({
      body: { count: 3, active: true, extra: null, tags: [1, 'ok\u0000'] },
      query: {},
      params: {},
    });

    runSanitize(req);

    expect(req.body).toEqual({ count: 3, active: true, extra: null, tags: [1, 'ok'] });
  });

  it('no rompe si body es null o undefined', () => {
    const reqA = makeReq({ body: null, query: {}, params: {} });
    const reqB = makeReq({ query: {}, params: {} });

    expect(() => runSanitize(reqA)).not.toThrow();
    expect(() => runSanitize(reqB)).not.toThrow();
  });
});
