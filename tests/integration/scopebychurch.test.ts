import express, { Router, type Request, type Response } from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { errorHandler } from '../../src/middlewares/error.middleware';
import { requireAuth } from '../../src/middlewares/auth.middleware';
import { scopeByChurch } from '../../src/middlewares/scopeByChurch';
import type { AuthUser } from '../../src/types/auth';
import { ok } from '../../src/utils/apiResponse';
import { signAccessToken } from '../../src/utils/jwt';

function buildApp(): express.Express {
  const app = express();
  app.use(express.json());

  const router = Router();
  router.get(
    '/api/v1/groups/:groupId',
    requireAuth,
    scopeByChurch((req) => req.params.groupId),
    (_req: Request, res: Response) => res.status(200).json(ok({ accessible: true })),
  );
  app.use(router);
  app.use(errorHandler);
  return app;
}

const churchAUser: AuthUser = {
  id: 'user-a',
  email: 'leader@iglesia-a.com',
  role: 'leader',
  churchId: 'church-a',
  firstName: 'Ana',
  lastName: 'Pérez',
};

const app = buildApp();
const churchAToken = signAccessToken(churchAUser);

describe('aislamiento multi-iglesia (scopeByChurch)', () => {
  it('el líder accede a un recurso de su propia iglesia', async () => {
    const res = await request(app)
      .get('/api/v1/groups/church-a')
      .set('Authorization', `Bearer ${churchAToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessible).toBe(true);
  });

  it('el líder NO puede acceder a recursos de otra iglesia (403)', async () => {
    const res = await request(app)
      .get('/api/v1/groups/church-b')
      .set('Authorization', `Bearer ${churchAToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('FORBIDDEN');
    expect(res.body.message).toContain('otra iglesia');
  });

  it('una petición sin token devuelve 401', async () => {
    const res = await request(app).get('/api/v1/groups/church-a');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('UNAUTHORIZED');
  });

  it('un token forjado devuelve 401', async () => {
    const res = await request(app)
      .get('/api/v1/groups/church-a')
      .set('Authorization', 'Bearer token-invalido');

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('INVALID_TOKEN');
  });
});
