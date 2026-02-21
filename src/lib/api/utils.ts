/**
 * API Utilities
 * 
 * Helper functions for API route generation and request handling.
 * 
 * @module lib/api/utils
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  APIResponse,
  APIResponseMeta,
  APIError,
  QueryParams,
  PaginationParams,
  SortParams,
  FilterParams,
} from './types';

// HTTP Status codes
export const HttpStatus = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

// Error codes
export const ErrorCodes = {
  INVALID_REQUEST: 'INVALID_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

/**
 * Create a standardized success response
 */
export function createSuccessResponse<T>(
  data: T,
  meta?: APIResponseMeta,
  statusCode: number = HttpStatus.OK
): NextResponse<APIResponse<T>> {
  const response: APIResponse<T> = { data };
  if (meta) {
    response.meta = meta;
  }
  return NextResponse.json(response, { status: statusCode });
}

/**
 * Create a standardized error response
 */
export function createErrorResponse(
  message: string,
  code: string = ErrorCodes.INTERNAL_ERROR,
  statusCode: number = HttpStatus.INTERNAL_SERVER_ERROR,
  details?: string,
  field?: string
): NextResponse<APIResponse<never>> {
  const error: APIError = { code, message };
  if (details) error.details = details;
  if (field) error.field = field;

  return NextResponse.json({ error }, { status: statusCode });
}

/**
 * Common error response helpers
 */
export const ApiErrors = {
  badRequest: (message: string, details?: string) =>
    createErrorResponse(message, ErrorCodes.INVALID_REQUEST, HttpStatus.BAD_REQUEST, details),
  
  unauthorized: (message = 'Authentication required') =>
    createErrorResponse(message, ErrorCodes.UNAUTHORIZED, HttpStatus.UNAUTHORIZED),
  
  forbidden: (message = 'Access denied') =>
    createErrorResponse(message, ErrorCodes.FORBIDDEN, HttpStatus.FORBIDDEN),
  
  notFound: (resource = 'Resource') =>
    createErrorResponse(`${resource} not found`, ErrorCodes.NOT_FOUND, HttpStatus.NOT_FOUND),
  
  conflict: (message: string) =>
    createErrorResponse(message, ErrorCodes.CONFLICT, HttpStatus.CONFLICT),
  
  validationError: (message: string, field?: string) =>
    createErrorResponse(message, ErrorCodes.VALIDATION_ERROR, HttpStatus.UNPROCESSABLE_ENTITY, undefined, field),
  
  rateLimited: (message = 'Too many requests') =>
    createErrorResponse(message, ErrorCodes.RATE_LIMITED, HttpStatus.TOO_MANY_REQUESTS),
  
  internalError: (message = 'Internal server error') =>
    createErrorResponse(message, ErrorCodes.INTERNAL_ERROR, HttpStatus.INTERNAL_SERVER_ERROR),
};

/**
 * Parse query parameters from request URL
 */
export function parseQueryParams(req: NextRequest): QueryParams {
  const { searchParams } = new URL(req.url);

  // Parse pagination
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)));
  const offset = (page - 1) * limit;

  const pagination: PaginationParams = { page, limit, offset };

  // Parse sort
  const sortField = searchParams.get('sort') || 'createdAt';
  const sortOrder = (searchParams.get('order') || 'desc') as 'asc' | 'desc';
  const sort: SortParams = { field: sortField, order: sortOrder };

  // Parse filters (exclude pagination and sort params)
  const filters: FilterParams = {};
  const excludedParams = ['page', 'limit', 'sort', 'order', 'search'];
  
  searchParams.forEach((value, key) => {
    if (!excludedParams.includes(key)) {
      // Handle array values (e.g., ?status=active&status=pending)
      if (filters[key]) {
        filters[key] = Array.isArray(filters[key])
          ? [...(filters[key] as string[]), value]
          : [filters[key] as string, value];
      } else {
        filters[key] = value;
      }
    }
  });

  // Parse search
  const search = searchParams.get('search') || undefined;

  return { pagination, filters, sort, search };
}

/**
 * Build Prisma where clause from filter params
 */
export function buildWhereClause(
  filters: FilterParams,
  options?: { searchableFields?: string[]; search?: string }
): Record<string, unknown> {
  const where: Record<string, unknown> = {};
  const conditions: Record<string, unknown>[] = [];

  // Add filter conditions
  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;

    if (Array.isArray(value)) {
      // Array filter: exact match for any value
      conditions.push({ [key]: { in: value } });
    } else if (value.includes(',')) {
      // Comma-separated list
      conditions.push({ [key]: { in: value.split(',') } });
    } else if (value.startsWith('gt:')) {
      // Greater than
      conditions.push({ [key]: { gt: value.replace('gt:', '') } });
    } else if (value.startsWith('gte:')) {
      // Greater than or equal
      conditions.push({ [key]: { gte: value.replace('gte:', '') } });
    } else if (value.startsWith('lt:')) {
      // Less than
      conditions.push({ [key]: { lt: value.replace('lt:', '') } });
    } else if (value.startsWith('lte:')) {
      // Less than or equal
      conditions.push({ [key]: { lte: value.replace('lte:', '') } });
    } else if (value.startsWith('neq:')) {
      // Not equal
      conditions.push({ [key]: { not: value.replace('neq:', '') } });
    } else if (value.includes('*')) {
      // Wildcard search
      conditions.push({ [key]: { contains: value.replace(/*/g, '%') } });
    } else if (value.startsWith('~')) {
      // Fuzzy search (contains)
      conditions.push({ [key]: { contains: value.slice(1), mode: 'insensitive' } });
    } else {
      // Exact match
      conditions.push({ [key]: value });
    }
  });

  // Add search condition
  if (options?.search && options?.searchableFields?.length) {
    const searchConditions = options.searchableFields.map((field) => ({
      [field]: { contains: options.search, mode: 'insensitive' },
    }));
    conditions.push({ OR: searchConditions });
  }

  // Combine conditions
  if (conditions.length === 1) {
    return conditions[0];
  } else if (conditions.length > 1) {
    return { AND: conditions };
  }

  return where;
}

/**
 * Validate request body against schema
 */
export async function validateRequestBody<T extends Record<string, unknown>>(
  schema: Record<string, (value: unknown) => boolean | string>,
  body: unknown
): Promise<{ valid: boolean; errors: string[]; data?: T }> {
  if (!body || typeof body !== 'object') {
    return { valid: false, errors: ['Invalid request body'] };
  }

  const errors: string[] = [];
  const bodyRecord = body as Record<string, unknown>;

  Object.entries(schema).forEach(([field, validator]) => {
    const value = bodyRecord[field];
    const result = validator(value);

    if (result !== true) {
      errors.push(typeof result === 'string' ? result : `Invalid value for ${field}`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    data: errors.length === 0 ? (body as T) : undefined,
  };
}

/**
 * Create pagination metadata
 */
export function createPaginationMeta(
  page: number,
  limit: number,
  total: number
): APIResponseMeta {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasMore: page < totalPages,
  };
}

/**
 * Handle BigInt serialization for JSON
 */
export function serializeBigInt<T>(obj: T): T {
  return JSON.parse(
    JSON.stringify(obj, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    )
  );
}

/**
 * Safe JSON parsing with error handling
 */
export function safeJsonParse<T>(json: string): { success: boolean; data?: T; error?: string } {
  try {
    return { success: true, data: JSON.parse(json) as T };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Invalid JSON' };
  }
}

/**
 * Extract ID from route params
 */
export function getIdFromParams(params: Record<string, string>): string | null {
  return params.id || params.slug || null;
}

/**
 * Check if request method is allowed
 */
export function isMethodAllowed(
  req: NextRequest,
  allowedMethods: string[]
): boolean {
  return allowedMethods.includes(req.method);
}

/**
 * Create CORS headers
 */
export function createCORSHeaders(origin = '*'): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

/**
 * Handle OPTIONS requests for CORS
 */
export function handleCORS(origin?: string): NextResponse {
  return new NextResponse(null, {
    status: 204,
    headers: createCORSHeaders(origin),
  });
}

export default {
  HttpStatus,
  ErrorCodes,
  createSuccessResponse,
  createErrorResponse,
  ApiErrors,
  parseQueryParams,
  buildWhereClause,
  validateRequestBody,
  createPaginationMeta,
  serializeBigInt,
  safeJsonParse,
  getIdFromParams,
  isMethodAllowed,
  createCORSHeaders,
  handleCORS,
};