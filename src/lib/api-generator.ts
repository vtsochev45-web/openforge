/**
 * API Route Generator
 *
 * Generates complete CRUD API routes for Prisma models.
 * Creates Next.js App Router compatible route files.
 *
 * @module lib/api-generator
 */

import { ModelDefinition } from './db/schema-generator';
import {
  GeneratedRoute,
  APIConfig,
  CrudOptions,
  RouteOperation,
} from './api/types';
import {
  generateCrudRouteContent,
  generateDynamicRouteContent,
} from './api/templates/crud-route.template';

// Default configurations
const DEFAULT_API_CONFIG: APIConfig = {
  authRequired: true,
  rateLimit: 60,
  cache: false,
};

const DEFAULT_CRUD_OPTIONS: CrudOptions = {
  softDelete: true,
  auditLog: false,
  includeRelations: [],
  filterableFields: [],
  sortableFields: ['createdAt', 'updatedAt'],
  searchableFields: ['name', 'title', 'description'],
};

/**
 * Generate CRUD API routes for a list of models
 */
export function generateAPRoutes(
  models: ModelDefinition[],
  config: Partial<APIConfig> = {},
  options: Partial<CrudOptions> = {}
): GeneratedRoute[] {
  const mergedConfig = { ...DEFAULT_API_CONFIG, ...config };
  const mergedOptions = { ...DEFAULT_CRUD_OPTIONS, ...options };

  const routes: GeneratedRoute[] = [];

  for (const model of models) {
    const modelRoutes = generateModelRoutes(model, mergedConfig, mergedOptions);
    routes.push(...modelRoutes);
  }

  return routes;
}

/**
 * Generate routes for a single model
 */
export function generateModelRoutes(
  model: ModelDefinition,
  config: APIConfig,
  options: CrudOptions
): GeneratedRoute[] {
  const modelNameLower = model.name.toLowerCase();
  const routes: GeneratedRoute[] = [];

  // Generate list/create route (base path)
  routes.push({
    path: `api/${modelNameLower}s/route.ts`,
    content: generateCrudRouteContent(model, config, options),
    method: 'ALL',
    model: model.name,
  });

  // Generate single item route (dynamic ID)
  routes.push({
    path: `api/${modelNameLower}s/[id]/route.ts`,
    content: generateDynamicRouteContent(model, config, options),
    method: 'ALL',
    model: model.name,
  });

  return routes;
}

/**
 * Generate only specified operations for a model
 */
export function generatePartialRoutes(
  model: ModelDefinition,
  operations: RouteOperation[],
  config: APIConfig = DEFAULT_API_CONFIG,
  options: CrudOptions = DEFAULT_CRUD_OPTIONS
): GeneratedRoute[] {
  const routes: GeneratedRoute[] = [];
  const hasListOrCreate = operations.some(
    op => op.type === 'list' || op.type === 'create'
  );
  const hasGetOrUpdateOrDelete = operations.some(
    op => op.type === 'get' || op.type === 'update' || op.type === 'delete'
  );

  if (hasListOrCreate) {
    routes.push({
      path: `api/${model.name.toLowerCase()}s/route.ts`,
      content: generateCrudRouteContent(model, config, options),
      method: 'ALL',
      model: model.name,
    });
  }

  if (hasGetOrUpdateOrDelete) {
    routes.push({
      path: `api/${model.name.toLowerCase()}s/[id]/route.ts`,
      content: generateDynamicRouteContent(model, config, options),
      method: 'ALL',
      model: model.name,
    });
  }

  return routes;
}

/**
 * Generate route files as a flat array of file objects
 */
export function generateRoutesAsFiles(
  models: ModelDefinition[],
  config: Partial<APIConfig> = {},
  options: Partial<CrudOptions> = {}
): Array<{ path: string; content: string }> {
  const routes = generateAPRoutes(models, config, options);
  return routes.map(route => ({
    path: route.path,
    content: route.content,
  }));
}

/**
 * Generate a combined API type definitions file
 */
export function generateAPITypes(models: ModelDefinition[]): string {
  const types = models.map(model => {
    const fields = model.fields.map(field => {
      let typeStr = field.type.toLowerCase();
      if (field.isOptional) typeStr += ' | null';
      return `  ${field.name}: ${typeStr};`;
    }).join('\n');

    return `export interface ${model.name} {\n${fields}\n}`;
  }).join('\n\n');

  return `// Auto-generated API types\n// Do not edit manually\n\n${types}`;
}

/**
 * Generate OpenAPI-like documentation for the API
 */
export function generateAPIDocumentation(
  models: ModelDefinition[],
  config: APIConfig
): string {
  const endpoints = models.flatMap(model => [
    {
      path: `/api/${model.name.toLowerCase()}s`,
      method: 'GET',
      description: `List all ${model.name}s`,
      auth: config.authRequired,
    },
    {
      path: `/api/${model.name.toLowerCase()}s`,
      method: 'POST',
      description: `Create a new ${model.name}`,
      auth: config.authRequired,
    },
    {
      path: `/api/${model.name.toLowerCase()}s/{id}`,
      method: 'GET',
      description: `Get a ${model.name} by ID`,
      auth: config.authRequired,
    },
    {
      path: `/api/${model.name.toLowerCase()}s/{id}`,
      method: 'PATCH',
      description: `Update a ${model.name}`,
      auth: config.authRequired,
    },
    {
      path: `/api/${model.name.toLowerCase()}s/{id}`,
      method: 'DELETE',
      description: `Delete a ${model.name}`,
      auth: config.authRequired,
    },
  ]);

  return JSON.stringify(
    {
      openapi: '3.0.0',
      info: {
        title: 'Generated API',
        version: '1.0.0',
      },
      paths: endpoints.reduce((acc: Record<string, Record<string, unknown>>, endpoint) => {
        if (!acc[endpoint.path]) acc[endpoint.path] = {} as Record<string, unknown>;
        acc[endpoint.path][endpoint.method.toLowerCase()] = {
          summary: endpoint.description,
          security: endpoint.auth ? [{ bearerAuth: [] }] : undefined,
        };
        return acc;
      }, {} as Record<string, Record<string, unknown>>),
    },
    null,
    2
  );
}

// Re-export types for convenience
export type {
  GeneratedRoute,
  APIConfig,
  CrudOptions,
  RouteOperation,
} from './api/types';

export default {
  generateAPRoutes,
  generateModelRoutes,
  generatePartialRoutes,
  generateRoutesAsFiles,
  generateAPITypes,
  generateAPIDocumentation,
};
