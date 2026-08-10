import { createClient } from 'redis';
import type { RedisClientType } from 'redis';
import { DASHBOARD_CACHE_PREFIX, GLOBAL_CHURCH_ID, dashboardKpisKey, dashboardSpiritualHealthKey } from '../constants/cache';
import logger from '../utils/logger';

interface MemoryEntry<T> {
  value: T;
  expiresAt: number;
}

const REDIS_URL = process.env.REDIS_URL;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function safeErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Error desconocido';
}

export class RedisService {
  private client: RedisClientType | null = null;
  private connecting: Promise<RedisClientType | null> | null = null;
  private readonly memory = new Map<string, MemoryEntry<unknown>>();

  private async getClient(): Promise<RedisClientType | null> {
    if (this.client) {
      return this.client;
    }
    if (this.connecting) {
      return this.connecting;
    }
    if (!REDIS_URL) {
      return null;
    }
    this.connecting = this.tryConnect();
    return this.connecting;
  }

  private async tryConnect(): Promise<RedisClientType | null> {
    const client = createClient({
      url: REDIS_URL,
      socket: {
        connectTimeout: 3000,
        reconnectStrategy: false,
      },
    });

    client.on('error', (error: Error) => {
      logger.warn('Redis: error de conexión, se usará caché en memoria', { message: error.message });
      this.client = null;
    });
    client.on('end', () => {
      this.client = null;
    });

    try {
      await client.connect();
      this.client = client;
      logger.info('Redis conectado correctamente');
      return client;
    } catch (error) {
      logger.warn('Redis no disponible; usando caché en memoria', { message: safeErrorMessage(error) });
      try {
        await client.quit();
      } catch (quitError) {
        logger.debug('Redis: fallo al cerrar cliente no conectado', { message: safeErrorMessage(quitError) });
      }
      return null;
    } finally {
      this.connecting = null;
    }
  }

  public async get<T>(key: string): Promise<T | null> {
    const client = await this.getClient();
    if (client) {
      try {
        const raw = await client.get(key);
        if (raw !== null) {
          return JSON.parse(raw) as T;
        }
      } catch (error) {
        logger.warn('Redis: error al leer clave, se usará caché en memoria', { message: safeErrorMessage(error) });
      }
    }
    return this.memoryGet<T>(key);
  }

  public async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    const client = await this.getClient();
    if (client) {
      try {
        await client.set(key, JSON.stringify(value), { EX: ttlSeconds });
        return;
      } catch (error) {
        logger.warn('Redis: error al escribir clave, se usará caché en memoria', { message: safeErrorMessage(error) });
      }
    }
    this.memorySet(key, value, ttlSeconds);
  }

  public async del(keys: string[]): Promise<void> {
    const uniqueKeys = [...new Set(keys)];
    uniqueKeys.forEach((key) => this.memory.delete(key));

    const client = await this.getClient();
    if (client && uniqueKeys.length > 0) {
      try {
        await client.del(uniqueKeys);
      } catch (error) {
        logger.warn('Redis: error al eliminar claves', { message: safeErrorMessage(error) });
      }
    }
  }

  public async invalidatePattern(pattern: string): Promise<void> {
    const regex = new RegExp(`^${pattern.split('*').map(escapeRegExp).join('.*')}$`);
    for (const key of this.memory.keys()) {
      if (regex.test(key)) {
        this.memory.delete(key);
      }
    }

    const client = await this.getClient();
    if (client) {
      try {
        const keys = await client.keys(pattern);
        if (keys.length > 0) {
          await client.del(keys);
        }
      } catch (error) {
        logger.warn('Redis: error al invalidar patrones', { message: safeErrorMessage(error) });
      }
    }
  }

  public async close(): Promise<void> {
    if (this.client) {
      try {
        await this.client.quit();
      } catch (error) {
        logger.warn('Redis: error al cerrar conexión', { message: safeErrorMessage(error) });
      }
      this.client = null;
    }
  }

  private memoryGet<T>(key: string): T | null {
    const entry = this.memory.get(key);
    if (!entry) {
      return null;
    }
    if (entry.expiresAt <= Date.now()) {
      this.memory.delete(key);
      return null;
    }
    return entry.value as T;
  }

  private memorySet<T>(key: string, value: T, ttlSeconds: number): void {
    this.memory.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }
}

export const cacheService = new RedisService();

export async function invalidateDashboardCache(churchId: string): Promise<void> {
  await cacheService.del([
    dashboardSpiritualHealthKey(churchId),
    dashboardKpisKey(churchId),
    dashboardSpiritualHealthKey(GLOBAL_CHURCH_ID),
    dashboardKpisKey(GLOBAL_CHURCH_ID),
  ]);
}

export async function invalidateAllDashboardCache(): Promise<void> {
  await cacheService.invalidatePattern(`${DASHBOARD_CACHE_PREFIX}*`);
}
