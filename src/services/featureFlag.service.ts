import { db } from '../models';
import { NotFoundError } from '../utils/errors';

const DEFAULT_FLAGS = [
  { name: 'calendar', description: 'Calendario de actividades', isEnabled: true, category: 'core' },
  { name: 'tithes', description: 'Diezmos y ofrendas', isEnabled: true, category: 'finance' },
  { name: 'ministries', description: 'Ministerios y voluntariado', isEnabled: true, category: 'core' },
  { name: 'pastoral_care', description: 'Cuidado pastoral y peticiones de oración', isEnabled: true, category: 'pastoral' },
  { name: 'baptism_pipeline', description: 'Pipeline de bautismo', isEnabled: true, category: 'education' },
  { name: 'documents', description: 'Repositorio de documentos', isEnabled: true, category: 'core' },
  { name: 'payments', description: 'Pasarela de pagos en línea', isEnabled: false, category: 'finance' },
  { name: 'notifications', description: 'Notificaciones email/WhatsApp', isEnabled: true, category: 'communication' },
];

export async function listFeatureFlags() {
  return db.FeatureFlag.findAll({ order: [['category', 'ASC'], ['name', 'ASC']] });
}

export async function getFeatureFlag(name: string) {
  const flag = await db.FeatureFlag.findOne({ where: { name } });
  if (!flag) {
    throw new NotFoundError(`Feature flag "${name}" no encontrada`);
  }
  return flag;
}

export async function updateFeatureFlag(name: string, isEnabled: boolean) {
  const flag = await getFeatureFlag(name);
  await flag.update({ isEnabled });
  return flag;
}

export async function isFeatureEnabled(name: string): Promise<boolean> {
  const flag = await db.FeatureFlag.findOne({ where: { name } });
  return flag ? flag.isEnabled : false;
}

export async function initDefaultFlags(): Promise<void> {
  const count = await db.FeatureFlag.count();
  if (count === 0) {
    await db.FeatureFlag.bulkCreate(DEFAULT_FLAGS);
  }
}
