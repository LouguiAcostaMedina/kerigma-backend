import type { Request, Response } from 'express';
import type {
  CreateClientInput,
  ListClientsQuery,
  UpdateClientInput,
} from '../schemas/client.schema';
import * as clientService from '../services/client.service';
import { ok, paginated } from '../utils/apiResponse';

export async function listClients(req: Request, res: Response): Promise<void> {
  const query = req.query as unknown as ListClientsQuery;
  const { clients, total } = await clientService.listClients(query);
  res.status(200).json(paginated(clients, total, query.page, query.limit));
}

export async function getClient(req: Request, res: Response): Promise<void> {
  const client = await clientService.getClient(req.params.id);
  res.status(200).json(ok(client));
}

export async function createClient(req: Request, res: Response): Promise<void> {
  const client = await clientService.createClient(req.body as CreateClientInput);
  res.status(201).json(ok(client, 'Cliente creado exitosamente'));
}

export async function updateClient(req: Request, res: Response): Promise<void> {
  const client = await clientService.updateClient(req.params.id, req.body as UpdateClientInput);
  res.status(200).json(ok(client, 'Cliente actualizado exitosamente'));
}

export async function deleteClient(req: Request, res: Response): Promise<void> {
  await clientService.deleteClient(req.params.id);
  res.status(200).json(ok(null, 'Cliente desactivado exitosamente'));
}

export async function getClientBySlug(req: Request, res: Response): Promise<void> {
  const client = await clientService.getClientBySlug(req.params.slug);
  res.status(200).json(ok(client));
}
