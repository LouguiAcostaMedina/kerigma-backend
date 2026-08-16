import type { Request, Response } from 'express';
import { CATALOGS, getCatalog, listCatalogNames, toEntries, toMap } from '../catalogs/catalog';
import { ok } from '../utils/apiResponse';
import { NotFoundError } from '../utils/errors';

function fullCatalogResponse(): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const name of listCatalogNames()) {
    const definition = CATALOGS[name as keyof typeof CATALOGS];
    result[name] = { values: definition.values, entries: toEntries(definition), labels: toMap(definition) };
  }
  return result;
}

export async function getFullCatalog(_req: Request, res: Response): Promise<void> {
  res.status(200).json(ok(fullCatalogResponse(), 'Catálogo del sistema'));
}

export async function getCatalogByName(req: Request, res: Response): Promise<void> {
  const definition = getCatalog(req.params.name);
  if (!definition) {
    throw new NotFoundError('Catálogo no encontrado');
  }
  res.status(200).json(
    ok({
      name: req.params.name,
      values: definition.values,
      entries: toEntries(definition),
      labels: toMap(definition),
    }),
  );
}
