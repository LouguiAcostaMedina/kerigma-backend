import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../../src/app';
import { env } from '../../src/config/env';

const app = createApp();
const BASE = `${env.apiBasePath}/${env.apiVersion}`;
const CHECKIN_URL = `${BASE}/attendance/checkin/00000000-0000-0000-0000-000000000000`;

describe('rate limits (endurecimiento)', () => {
  it('el check-in rechaza un payload sin memberId con 422', async () => {
    const res = await request(app).post(CHECKIN_URL).send({});
    expect([422, 429]).toContain(res.status);
  });

  it('el check-in público se limita a 30 peticiones por minuto', async () => {
    let lastStatus = 0;
    for (let i = 0; i < 31; i++) {
      const res = await request(app).post(CHECKIN_URL).send({});
      lastStatus = res.status;
      if (lastStatus === 429) {
        break;
      }
    }
    expect(lastStatus).toBe(429);
    expect(lastStatus).not.toBe(500);
  });
});
