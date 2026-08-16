import { Op, type WhereOptions } from 'sequelize';
import { db, type User } from '../models';
import { env } from '../config/env';
import type { UserRole } from '../types/auth';
import { signPasswordResetToken } from '../utils/jwt';
import type {
  CreateUserInput,
  ListUsersQuery,
  UpdateUserInput,
} from '../schemas/user.schema';
import { ConflictError, NotFoundError, ValidationError } from '../utils/errors';
import { buildPasswordResetEmail, sendEmail } from './email.service';

export type UserStatus = 'active' | 'inactive' | 'suspended' | 'pending';

export interface UserSummary {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  name: string;
  avatar: string | null;
  role: UserRole;
  phone: string | null;
  churchId: string | null;
  church: { id: string; name: string } | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  maritalStatus: string | null;
  occupation: string | null;
  emergencyContact: string | null;
  emergencyPhone: string | null;
  notes: string | null;
  isActive: boolean;
  isApproved: boolean;
  status: UserStatus;
  lastLogin: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UsersListResult {
  users: UserSummary[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
  stats: {
    total: number;
    active: number;
    inactive: number;
    suspended: number;
    pending: number;
    byRole: Record<string, number>;
    byChurch: Record<string, number>;
    recentActivity: UserSummary[];
  };
}

const CHURCH_INCLUDE = { model: db.Church, as: 'church', attributes: ['id', 'name'] };

function deriveStatus(user: Pick<User, 'isActive' | 'isApproved'>): UserStatus {
  if (!user.isActive) {
    return 'inactive';
  }
  if (!user.isApproved) {
    return 'pending';
  }
  return 'active';
}

function toUserSummary(user: User): UserSummary {
  const fullName = `${user.firstName} ${user.lastName}`.trim();
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    fullName,
    name: fullName,
    avatar: user.profileImage,
    role: user.role,
    phone: user.phone,
    churchId: user.churchId,
    church: user.churchId ? { id: user.churchId, name: user.church?.name ?? '' } : null,
    address: user.address,
    city: user.city,
    state: user.state,
    zipCode: user.zipCode,
    dateOfBirth: user.dateOfBirth,
    gender: user.gender,
    maritalStatus: user.maritalStatus,
    occupation: user.occupation,
    emergencyContact: user.emergencyContact,
    emergencyPhone: user.emergencyPhone,
    notes: user.notes,
    isActive: user.isActive,
    isApproved: user.isApproved,
    status: deriveStatus(user),
    lastLogin: user.lastLogin,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

async function findUser(scopeChurchId: string | null, userId: string): Promise<User> {
  const where: WhereOptions = { id: userId };
  if (scopeChurchId) {
    where.churchId = scopeChurchId;
  }
  const user = await db.User.findOne({ where, include: [CHURCH_INCLUDE] });
  if (!user) {
    throw new NotFoundError('Usuario no encontrado');
  }
  return user;
}

export async function listUsers(
  scopeChurchId: string | null,
  query: ListUsersQuery,
): Promise<UsersListResult> {
  const { page, limit, search, role, status, church, dateFrom, dateTo, sortField, sortDirection } = query;

  const where: WhereOptions = {};
  if (scopeChurchId) {
    where.churchId = scopeChurchId;
  }
  if (role) {
    where.role = role;
  }
  if (church) {
    where.churchId = church;
  }
  if (search) {
    const term = `%${search}%`;
    (where as Record<string | symbol, unknown>)[Op.or] = [
      { firstName: { [Op.iLike]: term } },
      { lastName: { [Op.iLike]: term } },
      { email: { [Op.iLike]: term } },
      { phone: { [Op.iLike]: term } },
    ];
  }
  if (status === 'active') {
    where.isActive = true;
    where.isApproved = true;
  } else if (status === 'inactive' || status === 'suspended') {
    where.isActive = false;
  } else if (status === 'pending') {
    where.isActive = true;
    where.isApproved = false;
  }
  if (dateFrom || dateTo) {
    where.createdAt = {
      ...(dateFrom ? { [Op.gte]: new Date(`${dateFrom}T00:00:00`) } : {}),
      ...(dateTo ? { [Op.lte]: new Date(`${dateTo}T23:59:59`) } : {}),
    };
  }

  const { rows, count } = await db.User.findAndCountAll({
    where,
    include: [CHURCH_INCLUDE],
    order: [[sortField as string, sortDirection]],
    limit,
    offset: (page - 1) * limit,
    distinct: true,
  });

  const users = rows.map(toUserSummary);
  const total = count;
  const [totalCount, activeCount, inactiveCount, byRoleRaw, byChurchRaw, recentRaw] = await Promise.all([
    db.User.count({ where: scopeChurchId ? { churchId: scopeChurchId } : {} }),
    db.User.count({ where: { ...(scopeChurchId ? { churchId: scopeChurchId } : {}), isActive: true, isApproved: true } }),
    db.User.count({ where: { ...(scopeChurchId ? { churchId: scopeChurchId } : {}), isActive: false } }),
    db.User.findAll({
      attributes: ['role', [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']],
      where: scopeChurchId ? { churchId: scopeChurchId } : {},
      group: ['role'],
      raw: true,
    }),
    db.User.findAll({
      attributes: ['churchId', [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']],
      where: { ...(scopeChurchId ? { churchId: scopeChurchId } : {}), churchId: { [Op.ne]: null } },
      group: ['churchId'],
      raw: true,
    }),
    db.User.findAll({
      where: scopeChurchId ? { churchId: scopeChurchId } : {},
      include: [CHURCH_INCLUDE],
      order: [['lastLogin', 'DESC']],
      limit: 5,
    }),
  ]);

  const byRole = Object.fromEntries(
    (byRoleRaw as unknown as Array<{ role: string; count: string }>).map((r) => [r.role, Number(r.count)]),
  );
  const byChurch = Object.fromEntries(
    (byChurchRaw as unknown as Array<{ churchId: string; count: string }>).map((r) => [r.churchId, Number(r.count)]),
  );

  return {
    users,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    stats: {
      total: totalCount,
      active: activeCount,
      inactive: inactiveCount,
      suspended: 0,
      pending: totalCount - activeCount - inactiveCount,
      byRole,
      byChurch,
      recentActivity: recentRaw.map(toUserSummary),
    },
  };
}

export async function getUserById(scopeChurchId: string | null, userId: string): Promise<UserSummary> {
  const user = await findUser(scopeChurchId, userId);
  return toUserSummary(user);
}

export async function createUser(actorId: string, input: CreateUserInput): Promise<UserSummary> {
  const email = input.email.toLowerCase().trim();
  const existing = await db.User.findOne({ where: { email } });
  if (existing) {
    throw new ConflictError('El email ya está registrado en el sistema');
  }

  const user = await db.User.create({
    email,
    password: input.password,
    firstName: input.firstName,
    lastName: input.lastName,
    phone: input.phone ?? null,
    role: input.role,
    churchId: input.churchId ?? null,
    address: input.address ?? null,
    city: input.city ?? null,
    state: input.state ?? null,
    zipCode: input.zipCode ?? null,
    dateOfBirth: input.dateOfBirth ?? null,
    gender: input.gender ?? null,
    maritalStatus: input.maritalStatus ?? null,
    occupation: input.occupation ?? null,
    emergencyContact: input.emergencyContact ?? null,
    emergencyPhone: input.emergencyPhone ?? null,
    notes: input.notes ?? null,
    isActive: input.isActive ?? true,
    isApproved: input.isApproved ?? true,
    createdBy: actorId,
    updatedBy: actorId,
  });

  return getUserById(null, user.id);
}

export async function updateUser(
  scopeChurchId: string | null,
  userId: string,
  actorId: string,
  input: UpdateUserInput,
): Promise<UserSummary> {
  const user = await findUser(scopeChurchId, userId);

  if (input.email) {
    const email = input.email.toLowerCase().trim();
    const existing = await db.User.findOne({ where: { email, id: { [Op.ne]: userId } } });
    if (existing) {
      throw new ConflictError('El email ya está registrado en el sistema');
    }
    await user.update({ email });
  }

  await user.update({
    firstName: input.firstName ?? user.firstName,
    lastName: input.lastName ?? user.lastName,
    phone: input.phone !== undefined ? input.phone : user.phone,
    role: input.role ?? user.role,
    churchId: input.churchId !== undefined ? input.churchId : user.churchId,
    address: input.address !== undefined ? input.address : user.address,
    city: input.city !== undefined ? input.city : user.city,
    state: input.state !== undefined ? input.state : user.state,
    zipCode: input.zipCode !== undefined ? input.zipCode : user.zipCode,
    dateOfBirth: input.dateOfBirth !== undefined ? input.dateOfBirth : user.dateOfBirth,
    gender: input.gender !== undefined ? input.gender : user.gender,
    maritalStatus: input.maritalStatus !== undefined ? input.maritalStatus : user.maritalStatus,
    occupation: input.occupation !== undefined ? input.occupation : user.occupation,
    emergencyContact: input.emergencyContact !== undefined ? input.emergencyContact : user.emergencyContact,
    emergencyPhone: input.emergencyPhone !== undefined ? input.emergencyPhone : user.emergencyPhone,
    notes: input.notes !== undefined ? input.notes : user.notes,
    isActive: input.isActive ?? user.isActive,
    isApproved: input.isApproved ?? user.isApproved,
    updatedBy: actorId,
  });

  return getUserById(scopeChurchId, userId);
}

export async function deleteUser(scopeChurchId: string | null, userId: string): Promise<void> {
  const user = await findUser(scopeChurchId, userId);
  await user.destroy();
}

export async function updateUserStatus(
  scopeChurchId: string | null,
  userId: string,
  status: 'active' | 'inactive' | 'suspended' | 'pending',
): Promise<UserSummary> {
  const user = await findUser(scopeChurchId, userId);

  if (status === 'active') {
    await user.update({ isActive: true, isApproved: true });
  } else if (status === 'inactive' || status === 'suspended') {
    await user.update({ isActive: false });
  } else if (status === 'pending') {
    await user.update({ isActive: true, isApproved: false });
  }

  return getUserById(scopeChurchId, userId);
}

export async function bulkOperation(
  scopeChurchId: string | null,
  operation: string,
  userIds: string[],
): Promise<void> {
  const where: WhereOptions = { id: { [Op.in]: userIds } };
  if (scopeChurchId) {
    where.churchId = scopeChurchId;
  }

  switch (operation) {
    case 'delete':
      await db.User.destroy({ where });
      return;
    case 'activate':
      await db.User.update({ isActive: true, isApproved: true }, { where });
      return;
    case 'deactivate':
    case 'suspend':
      await db.User.update({ isActive: false }, { where });
      return;
    case 'reactivate':
      await db.User.update({ isActive: true }, { where });
      return;
    default:
      throw new ValidationError('Operación en lote no soportada');
  }
}

export async function inviteUser(actorId: string, userId: string): Promise<void> {
  const user = await findUser(null, userId);
  const resetToken = signPasswordResetToken(user.id);
  const resetLink = `${env.cors.frontendUrl}/reset-password/${resetToken}`;
  await user.update({ updatedBy: actorId });
  await sendEmail(buildPasswordResetEmail(user.email, resetLink));
}

export async function resetUserPassword(userId: string): Promise<void> {
  const user = await findUser(null, userId);
  const resetToken = signPasswordResetToken(user.id);
  const resetLink = `${env.cors.frontendUrl}/reset-password/${resetToken}`;
  await sendEmail(buildPasswordResetEmail(user.email, resetLink));
}
