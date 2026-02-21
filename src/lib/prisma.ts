/**
 * Prisma Client Singleton
 * 
 * This module provides a singleton PrismaClient instance to prevent
 * multiple instances during hot reload in development.
 * 
 * @module lib/prisma
 */

import { PrismaClient } from '@prisma/client';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
// Learn more: https://pris.ly/d/help/next-js-best-practices

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Singleton PrismaClient instance
 * 
 * In development, this will reuse the same client across hot reloads.
 * In production, a fresh client is created.
 */
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'error', 'warn'] 
    : ['error'],
});

/**
 * Raw query execution helper with type safety
 */
export async function executeRaw<T = unknown>(
  query: string, 
  ...values: unknown[]
): Promise<T> {
  return prisma.$queryRawUnsafe<T>(query, ...values);
}

/**
 * Transaction helper with automatic rollback on error
 */
export async function withTransaction<T>(
  callback: (tx: typeof prisma) => Promise<T>
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    return callback(tx as typeof prisma);
  });
}

/**
 * Disconnect from database - useful for testing and cleanup
 */
export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect();
}

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;