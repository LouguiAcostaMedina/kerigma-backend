import { Op, QueryTypes, type WhereOptions } from 'sequelize';
import { db, type Church } from '../models';
import type {
  CreateChurchInput,
  ListChurchesQuery,
  NearbyChurchesQuery,
  UpdateChurchInput,
} from '../schemas/church.schema';
import { NotFoundError } from '../utils/errors';

export interface PublicChurch {
  id: string;
  name: string;
  city: string;
}

export interface ChurchSummary {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zipCode: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  pastor: string | null;
  pastorPhone: string | null;
  pastorEmail: string | null;
  pastorId: string | null;
  leaderId: string | null;
  capacity: number | null;
  status: Church['status'];
  foundedDate: string | null;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  membersCount: number;
  groupsCount: number;
  studentsCount: number;
  members: number;
  groups: number;
  location: string;
  contact: string | null;
  logo: string | null;
}

export interface ChurchesPaginatedResult {
  churches: ChurchSummary[];
  total: number;
}

function toChurchSummary(church: Church): ChurchSummary {
  const membersCount = church.members?.length ?? 0;
  const groupsCount = church.groups?.length ?? 0;
  const studentsCount = church.bibleStudents?.length ?? 0;
  return {
    id: church.id,
    name: church.name,
    address: church.address,
    city: church.city,
    state: church.state,
    country: church.country,
    zipCode: church.zipCode,
    phone: church.phone,
    email: church.email,
    website: church.website,
    pastor: church.pastor,
    pastorPhone: church.pastorPhone,
    pastorEmail: church.pastorEmail,
    pastorId: church.pastorId,
    leaderId: church.leaderId,
    capacity: church.capacity,
    status: church.status,
    foundedDate: church.foundedDate,
    description: church.description,
    isActive: church.isActive,
    createdAt: church.createdAt,
    updatedAt: church.updatedAt,
    membersCount,
    groupsCount,
    studentsCount,
    members: membersCount,
    groups: groupsCount,
    location: [church.city, church.state].filter(Boolean).join(', '),
    contact: church.phone ?? church.email,
    logo: null,
  };
}

const SEPARATE_INCLUDES = [
  { model: db.User, as: 'members', attributes: ['id'], separate: true, required: false },
  { model: db.Group, as: 'groups', attributes: ['id'], separate: true, required: false },
  { model: db.BibleStudent, as: 'bibleStudents', attributes: ['id'], separate: true, required: false },
];

export async function listPublicChurches(): Promise<PublicChurch[]> {
  const churches = await db.Church.findAll({
    where: { isActive: true },
    attributes: ['id', 'name', 'city'],
    order: [['name', 'ASC']],
  });
  return churches.map((c) => ({ id: c.id, name: c.name, city: c.city }));
}

export async function listChurches(
  churchId: string | null,
  query: ListChurchesQuery,
): Promise<ChurchesPaginatedResult> {
  const { page, limit, search, status, city, state, country, sortBy, sortOrder } = query;

  const where: WhereOptions = {};
  if (churchId) {
    where.id = churchId;
  }
  if (search) {
    const term = `%${search}%`;
    (where as Record<string | symbol, unknown>)[Op.or] = [
      { name: { [Op.iLike]: term } },
      { city: { [Op.iLike]: term } },
      { state: { [Op.iLike]: term } },
      { pastor: { [Op.iLike]: term } },
    ];
  }
  if (status) {
    where.status = status;
  }
  if (city) {
    where.city = { [Op.iLike]: `%${city}%` };
  }
  if (state) {
    where.state = { [Op.iLike]: `%${state}%` };
  }
  if (country) {
    where.country = { [Op.iLike]: `%${country}%` };
  }

  const sortColumn = sortBy === 'membersCount' ? 'name' : sortBy;

  const { rows, count } = await db.Church.findAndCountAll({
    where,
    include: SEPARATE_INCLUDES,
    order: [[sortColumn as string, sortOrder]],
    limit,
    offset: (page - 1) * limit,
    distinct: true,
  });

  let churches = rows.map(toChurchSummary);
  if (sortBy === 'membersCount') {
    churches = churches.sort((a, b) =>
      sortOrder === 'ASC' ? a.membersCount - b.membersCount : b.membersCount - a.membersCount,
    );
  }

  return { churches, total: count };
}

export async function getChurch(churchId: string | null, id: string): Promise<ChurchSummary> {
  const church = await db.Church.findByPk(id, { include: SEPARATE_INCLUDES });
  if (!church) {
    throw new NotFoundError('Iglesia no encontrada');
  }
  if (churchId && church.id !== churchId) {
    throw new NotFoundError('Iglesia no encontrada');
  }
  return toChurchSummary(church);
}

export async function createChurch(actorId: string, input: CreateChurchInput): Promise<ChurchSummary> {
  const church = await db.Church.create({
    name: input.name,
    address: input.address,
    city: input.city,
    state: input.state,
    country: input.country ?? 'Perú',
    zipCode: input.zipCode ?? null,
    latitude: input.latitude ?? null,
    longitude: input.longitude ?? null,
    phone: input.phone ?? null,
    email: input.email ?? null,
    website: input.website ?? null,
    socialMedia: input.socialMedia ?? null,
    pastor: input.pastor ?? null,
    pastorPhone: input.pastorPhone ?? null,
    pastorEmail: input.pastorEmail ?? null,
    pastorId: input.pastorId ?? null,
    leaderId: input.leaderId ?? null,
    capacity: input.capacity ?? null,
    facilities: input.facilities ?? null,
    services: input.services ?? null,
    status: input.status ?? 'active',
    foundedDate: input.foundedDate ?? null,
    description: input.description ?? null,
    isActive: true,
    createdBy: actorId,
    updatedBy: actorId,
  });

  return getChurch(null, church.id);
}

export async function updateChurch(
  churchId: string | null,
  id: string,
  actorId: string,
  input: UpdateChurchInput,
): Promise<ChurchSummary> {
  const church = await db.Church.findByPk(id);
  if (!church) {
    throw new NotFoundError('Iglesia no encontrada');
  }
  if (churchId && church.id !== churchId) {
    throw new NotFoundError('Iglesia no encontrada');
  }

  await church.update({
    name: input.name ?? church.name,
    address: input.address ?? church.address,
    city: input.city ?? church.city,
    state: input.state ?? church.state,
    country: input.country ?? church.country,
    zipCode: input.zipCode !== undefined ? input.zipCode : church.zipCode,
    latitude: input.latitude !== undefined ? input.latitude : church.latitude,
    longitude: input.longitude !== undefined ? input.longitude : church.longitude,
    phone: input.phone !== undefined ? input.phone : church.phone,
    email: input.email !== undefined ? input.email : church.email,
    website: input.website !== undefined ? input.website : church.website,
    socialMedia: input.socialMedia !== undefined ? input.socialMedia : church.socialMedia,
    pastor: input.pastor !== undefined ? input.pastor : church.pastor,
    pastorPhone: input.pastorPhone !== undefined ? input.pastorPhone : church.pastorPhone,
    pastorEmail: input.pastorEmail !== undefined ? input.pastorEmail : church.pastorEmail,
    pastorId: input.pastorId !== undefined ? input.pastorId : church.pastorId,
    leaderId: input.leaderId !== undefined ? input.leaderId : church.leaderId,
    capacity: input.capacity !== undefined ? input.capacity : church.capacity,
    facilities: input.facilities !== undefined ? input.facilities : church.facilities,
    services: input.services !== undefined ? input.services : church.services,
    status: input.status ?? church.status,
    foundedDate: input.foundedDate !== undefined ? input.foundedDate : church.foundedDate,
    description: input.description !== undefined ? input.description : church.description,
    updatedBy: actorId,
  });

  return getChurch(churchId, id);
}

export async function deleteChurch(churchId: string | null, id: string): Promise<void> {
  const church = await db.Church.findByPk(id);
  if (!church) {
    throw new NotFoundError('Iglesia no encontrada');
  }
  if (churchId && church.id !== churchId) {
    throw new NotFoundError('Iglesia no encontrada');
  }
  await church.destroy();
}

export interface NearbyChurchResult extends ChurchSummary {
  distanceKm: number;
}

const HAVERSINE_SQL = `
  6371 * 2 * ASIN(
    SQRT(
      POWER(SIN((:latitude - CAST("latitude" AS DOUBLE PRECISION)) * PI() / 360), 2) +
      COS(:latitude * PI() / 180) *
      COS(CAST("latitude" AS DOUBLE PRECISION) * PI() / 180) *
      POWER(SIN((:longitude - CAST("longitude" AS DOUBLE PRECISION)) * PI() / 360), 2)
    )
  )
`;

interface NearbyRow {
  id: string;
  distanceKm: number;
}

/**
 * Iglesias ordenadas por distancia (Haversine) desde un punto, dentro de un radio en km.
 * Requiere que las iglesias tengan latitude/longitude definidas.
 */
export async function listNearbyChurches(query: NearbyChurchesQuery): Promise<NearbyChurchResult[]> {
  const { latitude, longitude, radiusKm, limit } = query;

  const sql = `
    SELECT "id", ${HAVERSINE_SQL} AS "distanceKm"
    FROM "Churches"
    WHERE "latitude" IS NOT NULL
      AND "longitude" IS NOT NULL
      AND "deletedAt" IS NULL
      AND ${HAVERSINE_SQL} <= :radiusKm
    ORDER BY "distanceKm" ASC
    LIMIT :limit;
  `;

  const rows = (await db.sequelize.query(sql, {
    replacements: { latitude, longitude, radiusKm, limit },
    type: QueryTypes.SELECT,
  })) as NearbyRow[];

  if (rows.length === 0) {
    return [];
  }

  const churches = await db.Church.findAll({
    where: { id: rows.map((row) => row.id) },
    include: SEPARATE_INCLUDES,
  });
  const byId = new Map(churches.map((church) => [church.id, church]));

  return rows
    .map((row) => {
      const church = byId.get(row.id);
      if (!church) {
        return null;
      }
      return { ...toChurchSummary(church), distanceKm: Math.round(row.distanceKm * 1000) / 1000 };
    })
    .filter((result): result is NearbyChurchResult => result !== null);
}
