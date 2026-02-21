/**
 * API Generator Types
 * 
 * TypeScript definitions for API route generation system.
 * 
 * @module lib/api/types
 */

import { NextRequest, NextResponse } from 'next/server';

export interface GeneratedRoute {
  /** Relative path for the route file (e.g., 'api/posts/route.ts') */
  path: string;
  /** Full file content */
  content: string;
  /** Primary HTTP method */
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'ALL';
  /** Route segment name */
  model: string;
}

export interface APIConfig {
  /** Whether authentication is required for this endpoint */
  authRequired: boolean;
  /** Rate limit: requests per minute */
  rateLimit?: number;
  /** Enable response caching */
  cache?: boolean;
  /** Cache duration in seconds */
  cacheDuration?: number;
  /** Allowed roles for access control */
  allowedRoles?: string[];
}

export interface CrudOptions {
  /** Relations to include in responses */
  includeRelations?: string[];
  /** Enable soft delete (sets deletedAt instead of removing) */
  softDelete?: boolean;
  /** Enable audit logging */
  auditLog?: boolean;
  /** Fields that can be filtered on */
  filterableFields?: string[];
  /** Fields that can be sorted by */
  sortableFields?: string[];
  /** Fields that should be searchable */
  searchableFields?: string[];
}

export interface RouteHandlerContext {
  params: Record<string, string>;
}

export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

export interface FilterParams {
  [key: string]: string | string[] | undefined;
}

export interface SortParams {
  field: string;
  order: 'asc' | 'desc';
}

export interface QueryParams {
  pagination: PaginationParams;
  filters: FilterParams;
  sort: SortParams;
  search?: string;
}

export interface APIResponseMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export interface APIResponse<T = unknown> {
  data: T;
  meta?: APIResponseMeta;
  error?: APIError;
}

export interface APIError {
  code: string;
  message: string;
  details?: string;
  field?: string;
}

export interface ValidationRule {
  field: string;
  required?: boolean;
  type: 'string' | 'number' | 'boolean' | 'date' | 'email' | 'url';
  min?: number;
  max?: number;
  pattern?: string;
  custom?: string;
}

export interface RouteOperation {
  type: 'list' | 'get' | 'create' | 'update' | 'delete';
  auth?: boolean;
  validation?: ValidationRule[];
}

export interface ModelRoutes {
  model: string;
  operations: RouteOperation[];
  config: APIConfig;
  options: CrudOptions;
}

export type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

export interface MiddlewareFunction {
  (req: NextRequest): Promise<NextResponse | null>;
}

export type RouteHandler = (
  req: NextRequest,
  context: RouteHandlerContext
) => Promise<NextResponse> | NextResponse;

export interface RouteDefinition {
  path: string;
  methods: Partial<Record<HTTPMethod, RouteHandler>>;
  middleware?: MiddlewareFunction[];
}

// Prisma specific types
export interface PrismaQueryOptions {
  where?: Record<string, unknown>;
  include?: Record<string, unknown>;
  select?: Record<string, unknown>;
  orderBy?: Record<string, string> | Array<Record<string, string>>;
  skip?: number;
  take?: number;
}

export { NextRequest, NextResponse };