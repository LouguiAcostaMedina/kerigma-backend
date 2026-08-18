import { Op, type WhereOptions } from 'sequelize';
import { db } from '../models';
import type { Client } from '../models/Client.model';
import type {
  CreateClientInput,
  ListClientsQuery,
  UpdateClientInput,
} from '../schemas/client.schema';
import { NotFoundError } from '../utils/errors';

export interface ClientSummary {
  id: string;
  name: string;
  slug: string;
  plan: Client['plan'];
  maxChurches: number;
  maxUsers: number;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  isActive: boolean;
  trialEndsAt: Date | null;
  churchCount: number;
  createdAt: Date;
}

export interface ClientsPaginatedResult {
  clients: ClientSummary[];
  total: number;
}

function toClientSummary(client: Client): ClientSummary {
  const churchCount = (client as unknown as Record<string, unknown>).churchCount as number | undefined;
  return {
    id: client.id,
    name: client.name,
    slug: client.slug,
    plan: client.plan,
    maxChurches: client.maxChurches,
    maxUsers: client.maxUsers,
    contactName: client.contactName,
    contactEmail: client.contactEmail,
    contactPhone: client.contactPhone,
    isActive: client.isActive,
    trialEndsAt: client.trialEndsAt,
    churchCount: churchCount ?? 0,
    createdAt: client.createdAt,
  };
}

export async function listClients(query: ListClientsQuery): Promise<ClientsPaginatedResult> {
  const { page, limit, plan, isActive, search } = query;

  const where: WhereOptions = {};
  if (plan) {
    (where as Record<string, unknown>).plan = plan;
  }
  if (isActive !== undefined) {
    (where as Record<string, unknown>).isActive = isActive;
  }
  if (search) {
    const term = `%${search}%`;
    (where as Record<string | symbol, unknown>)[Op.or] = [
      { name: { [Op.iLike]: term } },
      { slug: { [Op.iLike]: term } },
      { contactEmail: { [Op.iLike]: term } },
    ];
  }

  const { rows, count } = await db.Client.findAndCountAll({
    where,
    attributes: {
      include: [
        [db.sequelize.literal('(SELECT COUNT(*) FROM "Churches" WHERE "Churches"."clientId" = "Client"."id")'), 'churchCount'],
      ],
    },
    order: [['createdAt', 'DESC']],
    limit,
    offset: (page - 1) * limit,
    subQuery: false,
  });

  return {
    clients: rows.map(toClientSummary),
    total: count,
  };
}

export async function getClient(id: string): Promise<ClientSummary> {
  const client = await db.Client.findByPk(id, {
    attributes: {
      include: [
        [db.sequelize.literal('(SELECT COUNT(*) FROM "Churches" WHERE "Churches"."clientId" = "Client"."id")'), 'churchCount'],
      ],
    },
  });

  if (!client) {
    throw new NotFoundError('Cliente no encontrado');
  }

  return toClientSummary(client);
}

export async function createClient(input: CreateClientInput): Promise<ClientSummary> {
  const client = await db.Client.create({
    name: input.name,
    slug: input.slug,
    plan: input.plan,
    maxChurches: input.maxChurches,
    maxUsers: input.maxUsers,
    contactName: input.contactName ?? null,
    contactEmail: input.contactEmail ?? null,
    contactPhone: input.contactPhone ?? null,
    trialEndsAt: input.trialEndsAt ?? null,
  });

  return getClient(client.id);
}

export async function updateClient(id: string, input: UpdateClientInput): Promise<ClientSummary> {
  const client = await db.Client.findByPk(id);
  if (!client) {
    throw new NotFoundError('Cliente no encontrado');
  }

  await client.update({
    name: input.name ?? client.name,
    slug: input.slug ?? client.slug,
    plan: input.plan ?? client.plan,
    maxChurches: input.maxChurches ?? client.maxChurches,
    maxUsers: input.maxUsers ?? client.maxUsers,
    contactName: input.contactName !== undefined ? input.contactName : client.contactName,
    contactEmail: input.contactEmail !== undefined ? input.contactEmail : client.contactEmail,
    contactPhone: input.contactPhone !== undefined ? input.contactPhone : client.contactPhone,
    isActive: input.isActive !== undefined ? input.isActive : client.isActive,
    trialEndsAt: input.trialEndsAt !== undefined ? input.trialEndsAt : client.trialEndsAt,
  });

  return getClient(id);
}

export async function deleteClient(id: string): Promise<void> {
  const client = await db.Client.findByPk(id);
  if (!client) {
    throw new NotFoundError('Cliente no encontrado');
  }

  await client.update({ isActive: false });
}

export async function getClientBySlug(slug: string): Promise<ClientSummary> {
  const client = await db.Client.findOne({
    where: { slug, isActive: true },
    attributes: {
      include: [
        [db.sequelize.literal('(SELECT COUNT(*) FROM "Churches" WHERE "Churches"."clientId" = "Client"."id")'), 'churchCount'],
      ],
    },
  });

  if (!client) {
    throw new NotFoundError('Cliente no encontrado');
  }

  return toClientSummary(client);
}
