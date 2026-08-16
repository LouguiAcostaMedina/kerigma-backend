import { beforeEach, describe, expect, it, vi } from 'vitest';
import { listNearbyChurches } from '../../src/services/church.service';

const models = vi.hoisted(() => ({
  sequelize: { query: vi.fn() },
  Church: { findAll: vi.fn() },
}));

vi.mock('../../src/models', () => ({ db: { sequelize: models.sequelize, Church: models.Church } }));

const baseChurch = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Iglesia Central',
  address: 'Av 1',
  city: 'Lima',
  state: 'Lima',
  country: 'Perú',
  zipCode: null,
  phone: null,
  email: null,
  website: null,
  pastor: null,
  pastorPhone: null,
  pastorEmail: null,
  pastorId: null,
  leaderId: null,
  capacity: null,
  status: 'active',
  foundedDate: null,
  description: null,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  members: [],
  groups: [],
  bibleStudents: [],
};

describe('listNearbyChurches (Haversine)', () => {
  beforeEach(() => {
    models.sequelize.query.mockReset();
    models.Church.findAll.mockReset();
  });

  it('devuelve [] si la consulta SQL no encuentra resultados', async () => {
    models.sequelize.query.mockResolvedValue([]);
    const result = await listNearbyChurches({ latitude: -12.04, longitude: -77.04, radiusKm: 25, limit: 25 });
    expect(result).toEqual([]);
    expect(models.Church.findAll).not.toHaveBeenCalled();
  });

  it('mapea las iglesias encontradas con su distancia', async () => {
    models.sequelize.query.mockResolvedValue([
      { id: baseChurch.id, distanceKm: 3.4567 },
    ]);
    models.Church.findAll.mockResolvedValue([{ ...baseChurch }]);

    const result = await listNearbyChurches({ latitude: -12.04, longitude: -77.04, radiusKm: 25, limit: 25 });

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ id: baseChurch.id, name: 'Iglesia Central', city: 'Lima' });
    expect(result[0].distanceKm).toBe(3.457);
  });

  it('ignora filas sin iglesia correspondiente y ordena por distancia', async () => {
    models.sequelize.query.mockResolvedValue([
      { id: 'a', distanceKm: 1 },
      { id: 'b', distanceKm: 5 },
      { id: 'huérfano', distanceKm: 2 },
    ]);
    models.Church.findAll.mockResolvedValue([
      { ...baseChurch, id: 'a', name: 'Iglesia A' },
      { ...baseChurch, id: 'b', name: 'Iglesia B' },
    ]);

    const result = await listNearbyChurches({ latitude: 0, longitude: 0, radiusKm: 10, limit: 10 });

    expect(result.map((c) => c.id)).toEqual(['a', 'b']);
    expect(result[0].distanceKm).toBe(1);
    expect(result[1].distanceKm).toBe(5);
  });

  it('construye la consulta SQL con radio y límite', async () => {
    models.sequelize.query.mockResolvedValue([]);
    await listNearbyChurches({ latitude: -12.04, longitude: -77.04, radiusKm: 50, limit: 10 });
    expect(models.sequelize.query).toHaveBeenCalledTimes(1);
    const [, options] = models.sequelize.query.mock.calls[0] as [{ type: unknown }, { replacements: unknown }];
    expect(options.replacements).toMatchObject({ latitude: -12.04, longitude: -77.04, radiusKm: 50, limit: 10 });
  });
});
