import winston from 'winston';
import path from 'path';
import fs from 'fs';
import { env } from '../config/env';

declare module 'winston' {
  interface Logger {
    database(operation: string, table: string, id: string, userId: string): void;
  }
}

const logDir = path.resolve(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const consoleFormat = winston.format.printf((info) => {
  const timestamp = typeof info.timestamp === 'string' ? info.timestamp : '';
  const level = typeof info.level === 'string' ? info.level : '';
  const message = typeof info.message === 'string' ? info.message : '';
  const stack = typeof info.stack === 'string' ? `\n${info.stack}` : '';
  return `${timestamp} [${level}] ${message}${stack}`;
});

const logger = winston.createLogger({
  level: env.logLevel,
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        consoleFormat,
      ),
    }),
    new winston.transports.File({
      filename: path.join(logDir, 'app.log'),
      level: env.logLevel,
      maxsize: 5 * 1024 * 1024,
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 5 * 1024 * 1024,
      maxFiles: 5,
    }),
  ],
});

logger.database = (operation: string, table: string, id: string, userId: string): void => {
  logger.info(`[DB] ${operation} ${table} ${id} (usuario: ${userId})`);
};

export default logger;
