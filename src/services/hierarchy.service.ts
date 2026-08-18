import { Op, type WhereOptions } from 'sequelize';
import { db } from '../models';
import type { Association } from '../models/Association.model';
import type { District } from '../models/District.model';
import { NotFoundError, ForbiddenError } from '../utils/errors';

export interface AssociationSummary {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  country: string;
  territory: string | null;
  presidentId: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  isActive: boolean;
  districtCount: number;
  createdBy: string | null;
  createdAt: Date;
}

export interface DistrictSummary {
  id: string;
  associationId: string;
  name: string;
  code: string | null;
  description: string | null;
  territory: string | null;
  directorId: string | null;
  phone: string | null;
  email: string | null;
  isActive: boolean;
  createdBy: string | null;
  createdAt: Date;
}

export interface AssociationsPaginatedResult {
  associations: AssociationSummary[];
  total: number;
}

export interface DistrictsPaginatedResult {
  districts: DistrictSummary[];
  total: number;
}

export interface ListAssociationsQuery {
  page: number;
  limit: number;
  search?: string;
  country?: string;
}

export interface ListDistrictsQuery {
  page: number;
  limit: number;
  search?: string;
}

export interface CreateAssociationInput {
  name: string;
  code?: string;
  description?: string;
  country: string;
  territory?: string;
  presidentId?: string;
  phone?: string;
  email?: string;
  address?: string;
}

export interface UpdateAssociationInput {
  name?: string;
  code?: string | null;
  description?: string | null;
  country?: string;
  territory?: string | null;
  presidentId?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  isActive?: boolean;
}

export interface CreateDistrictInput {
  associationId: string;
  name: string;
  code?: string;
  description?: string;
  territory?: string;
  directorId?: string;
  phone?: string;
  email?: string;
}

export interface UpdateDistrictInput {
  name?: string;
  code?: string | null;
  description?: string | null;
  territory?: string | null;
  directorId?: string | null;
  phone?: string | null;
  email?: string | null;
  isActive?: boolean;
}

function toAssociationSummary(association: Association, districtCount: number): AssociationSummary {
  return {
    id: association.id,
    name: association.name,
    code: association.code,
    description: association.description,
    country: association.country,
    territory: association.territory,
    presidentId: association.presidentId,
    phone: association.phone,
    email: association.email,
    address: association.address,
    isActive: association.isActive,
    districtCount,
    createdBy: association.createdBy,
    createdAt: association.createdAt,
  };
}

function toDistrictSummary(district: District): DistrictSummary {
  return {
    id: district.id,
    associationId: district.associationId,
    name: district.name,
    code: district.code,
    description: district.description,
    territory: district.territory,
    directorId: district.directorId,
    phone: district.phone,
    email: district.email,
    isActive: district.isActive,
    createdBy: district.createdBy,
    createdAt: district.createdAt,
  };
}

export async function listAssociations(
  query: ListAssociationsQuery,
): Promise<AssociationsPaginatedResult> {
  const { page, limit, search, country } = query;

  const where: WhereOptions = {};
  if (country) {
    (where as Record<string, unknown>).country = country;
  }
  if (search) {
    const term = `%${search}%`;
    (where as Record<string | symbol, unknown>)[Op.or] = [
      { name: { [Op.iLike]: term } },
      { code: { [Op.iLike]: term } },
      { description: { [Op.iLike]: term } },
    ];
  }

  const { rows, count } = await db.Association.findAndCountAll({
    where,
    order: [['name', 'ASC']],
    limit,
    offset: (page - 1) * limit,
    subQuery: false,
  });

  const associations = await Promise.all(
    rows.map(async (a) => {
      const districtCount = await db.District.count({ where: { associationId: a.id } });
      return toAssociationSummary(a, districtCount);
    }),
  );

  return { associations, total: count };
}

export async function getAssociation(id: string): Promise<AssociationSummary> {
  const association = await db.Association.findByPk(id);
  if (!association) {
    throw new NotFoundError('Asociación no encontrada');
  }
  const districtCount = await db.District.count({ where: { associationId: id } });
  return toAssociationSummary(association, districtCount);
}

export async function createAssociation(
  userId: string,
  input: CreateAssociationInput,
): Promise<AssociationSummary> {
  const association = await db.Association.create({
    name: input.name,
    code: input.code ?? null,
    description: input.description ?? null,
    country: input.country,
    territory: input.territory ?? null,
    presidentId: input.presidentId ?? null,
    phone: input.phone ?? null,
    email: input.email ?? null,
    address: input.address ?? null,
    isActive: true,
    createdBy: userId,
  });

  return getAssociation(association.id);
}

export async function updateAssociation(
  id: string,
  input: UpdateAssociationInput,
): Promise<AssociationSummary> {
  const association = await db.Association.findByPk(id);
  if (!association) {
    throw new NotFoundError('Asociación no encontrada');
  }

  await association.update({
    name: input.name ?? association.name,
    code: input.code !== undefined ? input.code : association.code,
    description: input.description !== undefined ? input.description : association.description,
    country: input.country ?? association.country,
    territory: input.territory !== undefined ? input.territory : association.territory,
    presidentId: input.presidentId !== undefined ? input.presidentId : association.presidentId,
    phone: input.phone !== undefined ? input.phone : association.phone,
    email: input.email !== undefined ? input.email : association.email,
    address: input.address !== undefined ? input.address : association.address,
    isActive: input.isActive ?? association.isActive,
  });

  return getAssociation(id);
}

export async function deleteAssociation(id: string): Promise<void> {
  const association = await db.Association.findByPk(id);
  if (!association) {
    throw new NotFoundError('Asociación no encontrada');
  }
  const districtCount = await db.District.count({ where: { associationId: id } });
  if (districtCount > 0) {
    throw new ForbiddenError('No se puede eliminar una asociación que tiene distritos');
  }
  await association.destroy();
}

export async function listDistricts(
  associationId: string,
  query: ListDistrictsQuery,
): Promise<DistrictsPaginatedResult> {
  const { page, limit, search } = query;

  const where: WhereOptions = { associationId };
  if (search) {
    const term = `%${search}%`;
    (where as Record<string | symbol, unknown>)[Op.or] = [
      { name: { [Op.iLike]: term } },
      { code: { [Op.iLike]: term } },
      { description: { [Op.iLike]: term } },
    ];
  }

  const { rows, count } = await db.District.findAndCountAll({
    where,
    order: [['name', 'ASC']],
    limit,
    offset: (page - 1) * limit,
    subQuery: false,
  });

  return { districts: rows.map(toDistrictSummary), total: count };
}

export async function getDistrict(id: string): Promise<DistrictSummary> {
  const district = await db.District.findByPk(id);
  if (!district) {
    throw new NotFoundError('Distrito no encontrado');
  }
  return toDistrictSummary(district);
}

export async function createDistrict(
  userId: string,
  input: CreateDistrictInput,
): Promise<DistrictSummary> {
  const association = await db.Association.findByPk(input.associationId);
  if (!association) {
    throw new NotFoundError('Asociación no encontrada');
  }

  const district = await db.District.create({
    associationId: input.associationId,
    name: input.name,
    code: input.code ?? null,
    description: input.description ?? null,
    territory: input.territory ?? null,
    directorId: input.directorId ?? null,
    phone: input.phone ?? null,
    email: input.email ?? null,
    isActive: true,
    createdBy: userId,
  });

  return getDistrict(district.id);
}

export async function updateDistrict(
  id: string,
  input: UpdateDistrictInput,
): Promise<DistrictSummary> {
  const district = await db.District.findByPk(id);
  if (!district) {
    throw new NotFoundError('Distrito no encontrado');
  }

  await district.update({
    name: input.name ?? district.name,
    code: input.code !== undefined ? input.code : district.code,
    description: input.description !== undefined ? input.description : district.description,
    territory: input.territory !== undefined ? input.territory : district.territory,
    directorId: input.directorId !== undefined ? input.directorId : district.directorId,
    phone: input.phone !== undefined ? input.phone : district.phone,
    email: input.email !== undefined ? input.email : district.email,
    isActive: input.isActive ?? district.isActive,
  });

  return getDistrict(id);
}

export async function deleteDistrict(id: string): Promise<void> {
  const district = await db.District.findByPk(id);
  if (!district) {
    throw new NotFoundError('Distrito no encontrado');
  }
  await district.destroy();
}
