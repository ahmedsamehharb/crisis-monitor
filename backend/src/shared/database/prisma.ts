import { PrismaClient } from '@prisma/client';
import { config } from '../../app/config/index.js';

/**
 * Prisma client singleton.
 * Requires DATABASE_URL and `npm run db:generate` after schema changes.
 */
export const prisma = config.databaseUrl
  ? new PrismaClient()
  : (null as unknown as PrismaClient);

export function isDatabaseEnabled(): boolean {
  return Boolean(config.databaseUrl);
}
