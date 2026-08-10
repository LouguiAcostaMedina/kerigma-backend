import { createApp } from './app';
import { env } from './config/env';
import { sequelize, testConnection } from './models';
import logger from './utils/logger';

async function bootstrap(): Promise<void> {
  await testConnection(sequelize);

  const app = createApp();

  app.listen(env.port, () => {
    logger.info(`Servidor iniciado en http://localhost:${env.port} (entorno: ${env.nodeEnv})`);
  });
}

bootstrap().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Error desconocido';
  logger.error('Error al iniciar el servidor', { message });
  process.exit(1);
});
