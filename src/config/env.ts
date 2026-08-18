import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const raw = process.env;

function required(name: string): string {
  const value = raw[name];
  if (value === undefined || value.trim() === '') {
    throw new Error(`Falta la variable de entorno obligatoria: ${name}`);
  }
  return value.trim();
}

function optional(name: string, fallback: string): string {
  const value = raw[name];
  return value === undefined || value.trim() === '' ? fallback : value.trim();
}

function optionalNumber(name: string, fallback: number): number {
  const value = raw[name];
  if (value === undefined || value.trim() === '') return fallback;
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    throw new Error(`La variable de entorno '${name}' debe ser numérica.`);
  }
  return parsed;
}

function parseOrigins(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

const nodeEnv = optional('NODE_ENV', 'development');

export const env = {
  nodeEnv,
  isProduction: nodeEnv === 'production',
  isTest: nodeEnv === 'test',
  isDevelopment: nodeEnv === 'development',
  port: optionalNumber('PORT', 3000),
  tz: optional('TZ', 'America/Lima'),
  apiVersion: optional('API_VERSION', 'v1'),
  apiBasePath: optional('API_BASE_PATH', '/api'),
  logLevel: optional('LOG_LEVEL', 'info'),
  jwt: {
    secret: required('JWT_SECRET'),
    expiresIn: optional('JWT_EXPIRES_IN', '24h'),
    refreshExpiresIn: optional('JWT_REFRESH_EXPIRES_IN', '7d'),
    issuer: 'mission-system-api',
    audience: 'mission-system-client',
  },
  db: {
    url: raw.DATABASE_URL === undefined || raw.DATABASE_URL.trim() === '' ? undefined : raw.DATABASE_URL.trim(),
    host: optional('DB_HOST', 'localhost'),
    port: optionalNumber('DB_PORT', 5432),
    name: optional('DB_NAME', 'mission_system_db'),
    user: optional('DB_USER', 'postgres'),
    password: optional('DB_PASSWORD', 'password'),
    dialect: 'postgres' as const,
  },
  cors: {
    frontendUrl: optional('FRONTEND_URL', 'http://localhost:5173'),
    allowedOrigins: raw.ALLOWED_ORIGINS === undefined ? [] : parseOrigins(raw.ALLOWED_ORIGINS),
  },
  bcrypt: {
    saltRounds: optionalNumber('BCRYPT_SALT_ROUNDS', 12),
  },
  rateLimit: {
    windowMs: optionalNumber('AUTH_RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000),
    max: optionalNumber('AUTH_RATE_LIMIT_MAX_REQUESTS', 100),
    loginMax: optionalNumber('AUTH_LOGIN_MAX_REQUESTS', 5),
    signupMax: optionalNumber('AUTH_SIGNUP_MAX_REQUESTS', 3),
    checkinWindowMs: optionalNumber('CHECKIN_RATE_LIMIT_WINDOW_MS', 60 * 1000),
    checkinMax: optionalNumber('CHECKIN_MAX_REQUESTS', 30),
  },
  admin: {
    email: optional('ADMIN_EMAIL', 'admin@sistema-misionero.com'),
    firstName: optional('ADMIN_FIRST_NAME', 'Administrador'),
    lastName: optional('ADMIN_LAST_NAME', 'Sistema'),
    phone: optional('ADMIN_PHONE', ''),
  },
  demo: {
    enabled: optional('DEMO_MODE', 'false') === 'true',
    email: optional('DEMO_EMAIL', 'demo@kerigma.com'),
    password: optional('DEMO_PASSWORD', 'DemoKerigma2024!'),
  },
} as const;
