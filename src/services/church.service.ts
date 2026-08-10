import { col, fn, Op, type WhereOptions } from 'sequelize';
import { db, type Church } from '../models';
import type {
  CreateChurchInput,
  ListChurchesQuery,
  UpdateChurchInput,
} from '../schemas/church.schema';
import { NotFoundError, ValidationError } from '../utils/errors';

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

export async function deleteMultipleChurches(churchId: string | null, ids: string[]): Promise<void> {
  const where: Record<string, unknown> = { id: { [Op.in]: ids } };
  if (churchId) {
    where.id = churchId;
  }
  await db.Church.destroy({ where });
}

export async function updateChurchStatus(
  churchId: string | null,
  id: string,
  actorId: string,
  status: Church['status'],
): Promise<ChurchSummary> {
  const church = await db.Church.findByPk(id);
  if (!church) {
    throw new NotFoundError('Iglesia no encontrada');
  }
  if (churchId && church.id !== churchId) {
    throw new NotFoundError('Iglesia no encontrada');
  }

  await church.update({
    status,
    isActive: status === 'active',
    updatedBy: actorId,
  });

  return getChurch(churchId, id);
}

export async function getChurchesStats(churchId: string | null) {
  const where: WhereOptions = {};
  if (churchId) {
    where.id = churchId;
  }

  const [total, active, construction, planning, inactive, byStatus, totalMembers, totalGroups, totalStudents] =
    await Promise.all([
      db.Church.count({ where }),
      db.Church.count({ where: { ...where, status: 'active' } }),
      db.Church.count({ where: { ...where, status: 'construction' } }),
      db.Church.count({ where: { ...where, status: 'planning' } }),
      db.Church.count({ where: { ...where, status: 'inactive' } }),
      db.Church.findAll({
        attributes: ['status', [fn('COUNT', col('id')), 'count']],
        where,
        group: ['status'],
        raw: true,
      }),
      db.User.count({ where: churchId ? { churchId } : {} }),
      db.Group.count({ where: churchId ? { churchId } : {} }),
      db.BibleStudent.count({ where: churchId ? { churchId } : {} }),
    ]);

  return {
    total,
    active,
    construction,
    planning,
    inactive,
    totalMembers,
    totalGroups,
    totalStudents,
    byStatus: Object.fromEntries(
      (byStatus as unknown as Array<{ status: string; count: string }>).map((r) => [r.status, Number(r.count)]),
    ),
  };
}

export async function checkChurchAccess(churchId: string | null, id: string): Promise<void> {
  const church = await db.Church.findByPk(id);
  if (!church) {
    throw new NotFoundError('Iglesia no encontrada');
  }
  if (churchId && church.id !== churchId) {
    throw new ValidationError('La iglesia no pertenece a su ámbito de acceso');
  }
}

export async function getChurchStatistics(churchId: string | null, id: string) {
  await checkChurchAccess(churchId, id);

  const groups = await db.Group.findAll({ where: { churchId: id }, attributes: ['id'] });
  const groupIds = groups.map((g) => g.id);
  const memberWhere: WhereOptions = groupIds.length > 0 ? { groupId: { [Op.in]: groupIds } } : { groupId: null };

  const [members, activeMembers, students, activeStudents, graduatedStudents, baptizedStudents, groupsCount] =
    await Promise.all([
      db.Member.count({ where: memberWhere }),
      db.Member.count({ where: { ...memberWhere, isActive: true } }),
      db.BibleStudent.count({ where: { churchId: id } }),
      db.BibleStudent.count({ where: { churchId: id, isActive: true } }),
      db.BibleStudent.count({ where: { churchId: id, status: 'graduated' } }),
      db.BibleStudent.count({ where: { churchId: id, baptized: true } }),
      db.Group.count({ where: { churchId: id } }),
    ]);

  return {
    churchId: id,
    groups: groupsCount,
    members,
    activeMembers,
    students,
    activeStudents,
    graduatedStudents,
    baptizedStudents,
  };
}

export async function exportChurchData(
  churchId: string | null,
  id: string,
  exportType: string,
): Promise<Array<{ name: string; rows: Record<string, unknown>[] }>> {
  await checkChurchAccess(churchId, id);

  const sheets: Array<{ name: string; rows: Record<string, unknown>[] }> = [];

  const groups = await db.Group.findAll({ where: { churchId: id }, order: [['name', 'ASC']] });
  const groupMap = new Map(groups.map((g) => [g.id, g.name]));
  const groupIds = groups.map((g) => g.id);
  const memberWhere: WhereOptions = groupIds.length > 0 ? { groupId: { [Op.in]: groupIds } } : { groupId: null };

  if (exportType === 'complete' || exportType === 'groups') {
    sheets.push({
      name: 'Grupos',
      rows: groups.map((g) => ({
        ID: g.id,
        Nombre: g.name,
        Tipo: g.type,
        Categoría: g.category,
        'Día de reunión': g.meetingDay,
        'Hora de reunión': g.meetingTime,
        Estado: g.status,
      })),
    });
  }

  if (exportType === 'complete' || exportType === 'members') {
    const members = await db.Member.findAll({ where: memberWhere, order: [['lastName', 'ASC']] });
    sheets.push({
      name: 'Miembros',
      rows: members.map((m) => ({
        ID: m.id,
        Nombre: m.firstName,
        Apellido: m.lastName,
        Email: m.email ?? '',
        Teléfono: m.phone ?? '',
        Grupo: groupMap.get(m.groupId) ?? '',
        Estado: m.status,
      })),
    });
  }

  if (exportType === 'complete' || exportType === 'students') {
    const students = await db.BibleStudent.findAll({ where: { churchId: id }, order: [['lastName', 'ASC']] });
    sheets.push({
      name: 'Estudiantes',
      rows: students.map((s) => ({
        ID: s.id,
        Nombre: s.firstName,
        Apellido: s.lastName,
        Email: s.email ?? '',
        Grupo: groupMap.get(s.groupId) ?? '',
        Programa: s.program,
        Nivel: s.level,
        Estado: s.status,
      })),
    });
  }

  return sheets;
}
