/**
 * API Generator Module
 *
 * Central export point for all API generation utilities.
 *
 * @module lib/api
 */

// Export main generator
export {
  generateAPRoutes,
  generateModelRoutes,
  generatePartialRoutes,
  generateRoutesAsFiles,
  generateAPITypes,
  generateAPIDocumentation,
} from '../api-generator';

// Export utilities
export {
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
} from './utils';

// Export types
export type {
  GeneratedRoute,
  APIConfig,
  CrudOptions,
  RouteOperation,
  RouteHandlerContext,
  PaginationParams,
  FilterParams,
  SortParams,
  QueryParams,
  APIResponseMeta,
  APIResponse,
  APIError,
  ValidationRule,
  ModelRoutes,
  HTTPMethod,
  MiddlewareFunction,
  RouteHandler,
  RouteDefinition,
  PrismaQueryOptions,
  NextRequest,
  NextResponse,
} from './types';

// Export templates
export {
  generateCrudRouteContent,
  generateDynamicRouteContent,
} from './templates/crud-route.template';

// Default export
export { default } from '../api-generator';
