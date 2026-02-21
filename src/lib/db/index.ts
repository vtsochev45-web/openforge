/**
 * Database utilities module
 * 
 * Central export point for all database-related modules.
 * 
 * @module lib/db
 */

// Re-export Prisma client
export { prisma, executeRaw, withTransaction, disconnectPrisma } from '../prisma';
export type { PrismaClient } from '@prisma/client';

// Re-export schema generator
export {
  generatePrismaSchema,
  extractSchemaFromPrompt,
  mergeSchemas,
  generateEnvTemplate,
} from './schema-generator';
export type {
  ModelField,
  ModelDefinition,
  SchemaConfig,
} from './schema-generator';

// Export default for convenience
export { default } from '../prisma';