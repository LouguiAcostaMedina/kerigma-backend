import { env } from '../config/env';
import { db, sequelize, testConnection } from '../models';
import logger from '../utils/logger';

async function createAdmin(): Promise<void> {
  await testConnection(sequelize);

  const email = env.admin.email;
  const existing = await db.User.findOne({ where: { email } });
  if (existing) {
    logger.warn(`El administrador ${email} ya existe. Omitiendo creación.`);
    await sequelize.close();
    return;
  }

  const password = process.env.ADMIN_PASSWORD;
  if (!password || password.length < 8) {
    logger.error('ADMIN_PASSWORD debe tener al menos 8 caracteres.');
    process.exitCode = 1;
    await sequelize.close();
    return;
  }

  // Rol del administrador: por defecto 'admin'. Usa ADMIN_ROLE=super_admin
  // para crear un SuperAdmin global (acceso al dashboard consolidado).
  const requestedRole = process.env.ADMIN_ROLE || 'admin';
  const role = requestedRole === 'super_admin' ? 'super_admin' : 'admin';

  await db.User.create({
    email,
    password,
    firstName: env.admin.firstName,
    lastName: env.admin.lastName,
    phone: env.admin.phone === '' ? null : env.admin.phone,
    role,
    churchId: null,
    isActive: true,
    isApproved: true,
  });

  logger.info(`Administrador creado correctamente (${role}): ${email}`);
  await sequelize.close();
}

createAdmin().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Error desconocido';
  logger.error('Error al crear el administrador', { message });
  process.exit(1);
});
