/**
 * CRUD Route Template Generator
 *
 * Generates full CRUD Next.js App Router route handlers for Prisma models.
 *
 * @module lib/api/templates/crud-route
 */

import { ModelDefinition } from '../../db/schema-generator';
import { APIConfig, CrudOptions, GeneratedRoute } from '../types';

/**
 * Generate a complete CRUD route file content
 */
export function generateCrudRouteContent(
  model: ModelDefinition,
  config: APIConfig,
  options: CrudOptions
): string {
  const modelName = model.name;
  const modelNameLower = modelName.toLowerCase();
  const modelNamePlural = `${modelNameLower}s`;

  return `import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  parseQueryParams,
  buildWhereClause,
  createSuccessResponse,
  createPaginationMeta,
  ApiErrors,
  serializeBigInt,
} from '@/lib/api/utils';

// Configuration
const MODEL_NAME = '${modelName}';
const AUTH_REQUIRED = ${config.authRequired};
const SOFT_DELETE = ${options.softDelete ?? false};
${options.includeRelations?.length ? `const INCLUDE_RELATIONS = ${JSON.stringify(options.includeRelations)};` : "const INCLUDE_RELATIONS = undefined;"}
${options.searchableFields?.length ? `const SEARCHABLE_FIELDS = ${JSON.stringify(options.searchableFields)};` : "const SEARCHABLE_FIELDS = ['name', 'description', 'title'];"}
${_getFilterableFields(model)}
${_getSortableFields(model)}

/**
 * GET /api/${modelNamePlural}
 * List all ${modelNamePlural} with pagination, filtering, and sorting
 */
export async function GET(req: NextRequest) {
  try {
    // Check auth if required
    ${config.authRequired ? `const session = await getServerSession(authOptions);
    if (!session?.user) {
      return ApiErrors.unauthorized();
    }
    ` : ''}

    // Parse query parameters
    const { pagination, filters, sort, search } = parseQueryParams(req);

    // Build where clause
    const where: Record<string, unknown> = {};

    // Add soft delete filter
    if (SOFT_DELETE) {
      where.deletedAt = null;
    }

    // Add search if provided
    if (search && SEARCHABLE_FIELDS.length > 0) {
      where.OR = SEARCHABLE_FIELDS.map(field => ({
        [field]: { contains: search, mode: 'insensitive' },
      }));
    }

    // Add filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value && FILTERABLE_FIELDS.includes(key)) {
        where[key] = value;
      }
    });

    // Build orderBy
    const orderBy: Record<string, string> = {};
    if (SORTABLE_FIELDS.includes(sort.field)) {
      orderBy[sort.field] = sort.order;
    } else {
      orderBy.createdAt = 'desc';
    }

    // Execute query
    const [items, total] = await Promise.all([
      prisma.${modelNameLower}.findMany({
        where,
        skip: pagination.offset,
        take: pagination.limit,
        orderBy,
        ...(INCLUDE_RELATIONS ? { include: INCLUDE_RELATIONS } : {}),
      }),
      prisma.${modelNameLower}.count({ where }),
    ]);

    // Serialize response (handle BigInt)
    const serializedItems = serializeBigInt(items);

    return createSuccessResponse(
      serializedItems,
      createPaginationMeta(pagination.page, pagination.limit, total)
    );
  } catch (error) {
    console.error('Error fetching ${modelNamePlural}:', error);
    return ApiErrors.internalError('Failed to fetch ${modelNamePlural}');
  }
}

/**
 * POST /api/${modelNamePlural}
 * Create a new ${modelName}
 */
export async function POST(req: NextRequest) {
  try {
    // Check auth if required
    ${config.authRequired ? `const session = await getServerSession(authOptions);
    if (!session?.user) {
      return ApiErrors.unauthorized();
    }
    ` : ''}

    // Parse request body
    const body = await req.json();

    // Validate required fields
    const requiredFields = ${JSON.stringify(_getRequiredFields(model))};
    const missingFields = requiredFields.filter(field => !body[field]);

    if (missingFields.length > 0) {
      return ApiErrors.validationError(
        \\\`Missing required fields: \${missingFields.join(', ')}\\\`,
        missingFields.join(',')
      );
    }

    ${options.auditLog ? `// Add audit fields
    body.createdBy = session?.user?.id;
    body.updatedBy = session?.user?.id;` : ''}

    // Create record
    const item = await prisma.${modelNameLower}.create({
      data: body,
      ...(INCLUDE_RELATIONS ? { include: INCLUDE_RELATIONS } : {}),
    });

    return createSuccessResponse(serializeBigInt(item), undefined, 201);
  } catch (error) {
    console.error('Error creating ${modelName}:', error);

    // Handle Prisma unique constraint errors
    if (error?.code === 'P2002') {
      return ApiErrors.conflict(
        \\\`A \${MODEL_NAME} with this \${error?.meta?.target?.[0]} already exists\\\`
      );
    }

    return ApiErrors.internalError('Failed to create ' + MODEL_NAME);
  }
}
`;
}

/**
 * Generate dynamic route content (single item operations)
 */
export function generateDynamicRouteContent(
  model: ModelDefinition,
  config: APIConfig,
  options: CrudOptions
): string {
  const modelName = model.name;
  const modelNameLower = modelName.toLowerCase();
  const modelNamePlural = `${modelNameLower}s`;

  return `import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  createSuccessResponse,
  ApiErrors,
  serializeBigInt,
  getIdFromParams,
} from '@/lib/api/utils';

// Configuration
const MODEL_NAME = '${modelName}';
const SOFT_DELETE = ${options.softDelete ?? false};
${options.includeRelations?.length ? `const INCLUDE_RELATIONS = ${JSON.stringify(options.includeRelations)};` : 'const INCLUDE_RELATIONS = undefined;'}

interface RouteContext {
  params: { id: string };
}

/**
 * GET /api/${modelNamePlural}/[id]
 * Get a single ${modelName} by ID
 */
export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params;

    if (!id) {
      return ApiErrors.badRequest('ID is required');
    }

    const where: Record<string, unknown> = { id };
    if (SOFT_DELETE) {
      where.deletedAt = null;
    }

    const item = await prisma.${modelNameLower}.findFirst({
      where,
      ...(INCLUDE_RELATIONS ? { include: INCLUDE_RELATIONS } : {}),
    });

    if (!item) {
      return ApiErrors.notFound(MODEL_NAME);
    }

    return createSuccessResponse(serializeBigInt(item));
  } catch (error) {
    console.error('Error fetching ${modelName}:', error);
    return ApiErrors.internalError('Failed to fetch ' + MODEL_NAME);
  }
}

/**
 * PATCH /api/${modelNamePlural}/[id]
 * Update a ${modelName} by ID
 */
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    // Check auth
    ${config.authRequired ? `const session = await getServerSession(authOptions);
    if (!session?.user) {
      return ApiErrors.unauthorized();
    }
    ` : ''}

    const { id } = params;

    if (!id) {
      return ApiErrors.badRequest('ID is required');
    }

    // Check if exists
    const existing = await prisma.${modelNameLower}.findUnique({
      where: { id },
    });

    if (!existing) {
      return ApiErrors.notFound(MODEL_NAME);
    }

    // Parse and validate update data
    const body = await req.json();
    delete body.id; // Prevent ID change
    delete body.createdAt; // Prevent timestamp changes

    ${options.auditLog ? `body.updatedBy = session?.user?.id;
    body.updatedAt = new Date();` : ''}

    const item = await prisma.${modelNameLower}.update({
      where: { id },
      data: body,
      ...(INCLUDE_RELATIONS ? { include: INCLUDE_RELATIONS } : {}),
    });

    return createSuccessResponse(serializeBigInt(item));
  } catch (error) {
    console.error('Error updating ${modelName}:', error);

    if (error?.code === 'P2025') {
      return ApiErrors.notFound(MODEL_NAME);
    }

    if (error?.code === 'P2002') {
      return ApiErrors.conflict('Unique constraint violation');
    }

    return ApiErrors.internalError('Failed to update ' + MODEL_NAME);
  }
}

/**
 * DELETE /api/${modelNamePlural}/[id]
 * Delete a ${modelName} by ID
 */
export async function DELETE(req: NextRequest, { params }: RouteContext) {
  try {
    // Check auth
    ${config.authRequired ? `const session = await getServerSession(authOptions);
    if (!session?.user) {
      return ApiErrors.unauthorized();
    }
    ` : ''}

    const { id } = params;

    if (!id) {
      return ApiErrors.badRequest('ID is required');
    }

    // Check if exists
    ${options.softDelete ? `const existing = await prisma.${modelNameLower}.findUnique({
      where: { id },
    });

    if (!existing) {
      return ApiErrors.notFound(MODEL_NAME);
    }

    // Soft delete
    await prisma.${modelNameLower}.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        ${options.auditLog ? 'deletedBy: session?.user?.id,' : ''}
      },
    });` : `await prisma.${modelNameLower}.delete({
      where: { id },
    });`}

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting ${modelName}:', error);

    if (error?.code === 'P2025') {
      return ApiErrors.notFound(MODEL_NAME);
    }

    return ApiErrors.internalError('Failed to delete ' + MODEL_NAME);
  }
}
`;
}

// Helper functions for template generation

function _getRequiredFields(model: ModelDefinition): string[] {
  return model.fields
    .filter(f => !f.isOptional && !f.isId && !f.defaultValue)
    .map(f => f.name);
}

function _getFilterableFields(model: ModelDefinition): string {
  const fields = model.fields
    .filter(f => ['String', 'Int', 'Boolean', 'DateTime'].includes(f.type))
    .map(f => `'${f.name}'`);
  return `const FILTERABLE_FIELDS = [${fields.join(', ')}];`;
}

function _getSortableFields(model: ModelDefinition): string {
  const fields = model.fields
    .filter(f => ['String', 'Int', 'DateTime'].includes(f.type))
    .map(f => `'${f.name}'`);
  return `const SORTABLE_FIELDS = [${fields.join(', ')}, 'createdAt', 'updatedAt'];`;
}

export default {
  generateCrudRouteContent,
  generateDynamicRouteContent,
};