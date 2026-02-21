import { ModelDefinition } from '../../db/schema-generator';
import { APIConfig, CrudOptions } from '../types';

export function generateCrudRouteContent(
  model: ModelDefinition,
  config: APIConfig,
  options: CrudOptions
): string {
  const modelName = model.name;
  const modelNameLower = modelName.toLowerCase();
  const modelNamePlural = `${modelNameLower}s`;

  const requiredFieldsStr = JSON.stringify(_getRequiredFields(model));
  const includeRelations = options.includeRelations?.length ? `const INCLUDE_RELATIONS = ${JSON.stringify(options.includeRelations)};` : "const INCLUDE_RELATIONS = undefined;";
  const searchableFields = options.searchableFields?.length ? `const SEARCHABLE_FIELDS = ${JSON.stringify(options.searchableFields)};` : "const SEARCHABLE_FIELDS = ['name', 'description', 'title'];";
  const filterableFields = _getFilterableFields(model);
  const sortableFields = _getSortableFields(model);
  const authCheck = config.authRequired ? `const session = await getServerSession(authOptions);
    if (!session?.user) {
      return ApiErrors.unauthorized();
    }` : '';

  return `import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  parseQueryParams,
  createSuccessResponse,
  createPaginationMeta,
  ApiErrors,
  serializeBigInt,
} from '@/lib/api/utils';

const MODEL_NAME = '${modelName}';
const AUTH_REQUIRED = ${config.authRequired};
const SOFT_DELETE = ${options.softDelete ?? false};
${includeRelations}
${searchableFields}
${filterableFields}
${sortableFields}

export async function GET(req: NextRequest) {
  try {
    ${authCheck}
    const { pagination, filters, sort, search } = parseQueryParams(req);
    const where: Record<string, unknown> = {};
    if (SOFT_DELETE) where.deletedAt = null;
    if (search && SEARCHABLE_FIELDS.length > 0) {
      where.OR = SEARCHABLE_FIELDS.map(field => ({
        [field]: { contains: search, mode: 'insensitive' },
      }));
    }
    Object.entries(filters).forEach(([key, value]) => {
      if (value && FILTERABLE_FIELDS.includes(key)) where[key] = value;
    });
    const orderBy: Record<string, string> = SORTABLE_FIELDS.includes(sort.field)
      ? { [sort.field]: sort.order }
      : { createdAt: 'desc' };
    const [items, total] = await Promise.all([
      prisma.${modelNameLower}.findMany({
        where, skip: pagination.offset, take: pagination.limit, orderBy,
        ...(INCLUDE_RELATIONS ? { include: INCLUDE_RELATIONS } : {}),
      }),
      prisma.${modelNameLower}.count({ where }),
    ]);
    return createSuccessResponse(
      serializeBigInt(items),
      createPaginationMeta(pagination.page, pagination.limit, total)
    );
  } catch (error) {
    console.error('Error fetching ${modelNamePlural}:', error);
    return ApiErrors.internalError('Failed to fetch ${modelNamePlural}');
  }
}

export async function POST(req: NextRequest) {
  try {
    ${authCheck}
    const body = await req.json();
    const requiredFields = ${requiredFieldsStr};
    const missingFields = requiredFields.filter(field => !body[field]);
    if (missingFields.length > 0) {
      return ApiErrors.validationError(
        'Missing required fields: ' + missingFields.join(', '),
        missingFields.join(',')
      );
    }
    ${options.auditLog ? 'body.createdBy = session?.user?.id; body.updatedBy = session?.user?.id;' : ''}
    const item = await prisma.${modelNameLower}.create({
      data: body,
      ...(INCLUDE_RELATIONS ? { include: INCLUDE_RELATIONS } : {}),
    });
    return createSuccessResponse(serializeBigInt(item), undefined, 201);
  } catch (error: any) {
    console.error('Error creating ${modelName}:', error);
    if (error?.code === 'P2002') {
      return ApiErrors.conflict(
        'A ' + MODEL_NAME + ' with this ' + (error?.meta?.target?.[0] || 'field') + ' already exists'
      );
    }
    return ApiErrors.internalError('Failed to create ' + MODEL_NAME);
  }
}
`;
}

export function generateDynamicRouteContent(
  model: ModelDefinition,
  config: APIConfig,
  options: CrudOptions
): string {
  const modelName = model.name;
  const modelNameLower = modelName.toLowerCase();

  const includeRelations = options.includeRelations?.length ? `const INCLUDE_RELATIONS = ${JSON.stringify(options.includeRelations)};` : 'const INCLUDE_RELATIONS = undefined;';
  const authCheck = config.authRequired ? `const session = await getServerSession(authOptions);
    if (!session?.user) return ApiErrors.unauthorized();` : '';

  return `import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createSuccessResponse, ApiErrors, serializeBigInt } from '@/lib/api/utils';

const MODEL_NAME = '${modelName}';
const SOFT_DELETE = ${options.softDelete ?? false};
${includeRelations}

interface RouteContext {
  params: { id: string };
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params;
    if (!id) return ApiErrors.badRequest('ID is required');
    const where: Record<string, unknown> = { id };
    if (SOFT_DELETE) where.deletedAt = null;
    const item = await prisma.${modelNameLower}.findFirst({
      where,
      ...(INCLUDE_RELATIONS ? { include: INCLUDE_RELATIONS } : {}),
    });
    if (!item) return ApiErrors.notFound(MODEL_NAME);
    return createSuccessResponse(serializeBigInt(item));
  } catch (error) {
    console.error('Error fetching ${modelName}:', error);
    return ApiErrors.internalError('Failed to fetch ' + MODEL_NAME);
  }
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    ${authCheck}
    const { id } = params;
    if (!id) return ApiErrors.badRequest('ID is required');
    const existing = await prisma.${modelNameLower}.findUnique({ where: { id } });
    if (!existing) return ApiErrors.notFound(MODEL_NAME);
    const body = await req.json();
    delete body.id;
    delete body.createdAt;
    ${options.auditLog ? 'body.updatedBy = session?.user?.id; body.updatedAt = new Date();' : ''}
    const item = await prisma.${modelNameLower}.update({ where: { id }, data: body,
      ...(INCLUDE_RELATIONS ? { include: INCLUDE_RELATIONS } : {}),
    });
    return createSuccessResponse(serializeBigInt(item));
  } catch (error: any) {
    console.error('Error updating ${modelName}:', error);
    if (error?.code === 'P2025') return ApiErrors.notFound(MODEL_NAME);
    if (error?.code === 'P2002') return ApiErrors.conflict('Unique constraint violation');
    return ApiErrors.internalError('Failed to update ' + MODEL_NAME);
  }
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  try {
    ${authCheck}
    const { id } = params;
    if (!id) return ApiErrors.badRequest('ID is required');
    ${options.softDelete ? `const existing = await prisma.${modelNameLower}.findUnique({ where: { id } });
    if (!existing) return ApiErrors.notFound(MODEL_NAME);
    await prisma.${modelNameLower}.update({
      where: { id },
      data: { deletedAt: new Date(), ${options.auditLog ? 'deletedBy: session?.user?.id,' : ''} },
    });` : `await prisma.${modelNameLower}.delete({ where: { id } });`}
    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    console.error('Error deleting ${modelName}:', error);
    if (error?.code === 'P2025') return ApiErrors.notFound(MODEL_NAME);
    return ApiErrors.internalError('Failed to delete ' + MODEL_NAME);
  }
}
`;
}

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

export default { generateCrudRouteContent, generateDynamicRouteContent };
