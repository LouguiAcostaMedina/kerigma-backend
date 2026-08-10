import { Sequelize, type Options } from 'sequelize';
import { env } from './env';
import logger from '../utils/logger';

function buildPool(isProduction: boolean): Options['pool'] {
  return isProduction
    ? { max: 20, min: 5, acquire: 30000, idle: 10000, evict: 1000 }
    : { max: 5, min: 0, acquire: 30000, idle: 10000 };
}

function buildSequelizeOptions(environment: string = env.nodeEnv): Options {
  const isProduction = environment === 'production';
  const ssl = isProduction ? { require: true, rejectUnauthorized: false } : false;

  const common: Options = {
    dialect: 'postgres',
    logging: (message: string) => logger.debug(message),
    pool: buildPool(isProduction),
    dialectOptions: {
      ssl,
      statement_timeout: 30000,
      idle_in_transaction_session_timeout: 30000,
      connectTimeout: 60000,
    },
    timezone: env.tz,
    define: {
      timestamps: true,
      underscored: false,
      freezeTableName: true,
      paranoid: false,
    },
    retry: {
      max: 3,
      match: [/ETIMEDOUT/, /EHOSTUNREACH/, /ECONNRESET/, /ECONNREFUSED/, /TIMEOUT/],
    },
  };

  if (env.db.url) {
    return common;
  }

  return {
    ...common,
    host: env.db.host,
    port: env.db.port,
    database: env.db.name,
    username: env.db.user,
    password: env.db.password,
  };
}

export function createSequelize(environment: string = env.nodeEnv): Sequelize {
  const options = buildSequelizeOptions(environment);

  if (env.db.url) {
    return new Sequelize(env.db.url, options);
  }

  return new Sequelize(
    env.db.name,
    env.db.user,
    env.db.password,
    options,
  );
}

export async function testConnection(instance: Sequelize): Promise<void> {
  await instance.authenticate();
  logger.info('Conexión a la base de datos establecida correctamente');
}
