/**
 * Prisma Schema Generator
 * 
 * Generates Prisma schemas from model definitions and prompts.
 * Supports dynamic schema generation for AI-generated applications.
 * 
 * @module lib/db/schema-generator
 */

export interface ModelField {
  name: string;
  type: string;
  isOptional?: boolean;
  isUnique?: boolean;
  isId?: boolean;
  defaultValue?: string;
  relation?: {
    model: string;
    field: string;
  };
}

export interface ModelDefinition {
  name: string;
  fields: ModelField[];
}

export interface SchemaConfig {
  provider: 'sqlite' | 'postgresql' | 'mysql';
  url: string;
  previewFeatures?: string[];
}

const DEFAULT_BASE_SCHEMA = `generator client {
  provider = "prisma-client-js"
  previewFeatures = ["fullTextSearch", "fullTextIndex"]
}

datasource db {
  provider = "{{PROVIDER}}"
  url      = env("DATABASE_URL")
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([provider, providerAccountId])
  @@index([userId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@index([userId])
}

model User {
  id             String    @id @default(cuid())
  name           String?
  email          String    @unique
  emailVerified  DateTime?
  image          String?
  password       String?
  role           String    @default("user")
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
  deletedAt      DateTime?
  accounts Account[]
  sessions Session[]
  {{USER_RELATIONS}}
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime
  @@unique([identifier, token])
}`;

/**
 * Generate a complete Prisma schema string from model definitions
 */
export function generatePrismaSchema(
  models: ModelDefinition[],
  config: SchemaConfig = { provider: 'sqlite', url: 'env("DATABASE_URL")' }
): string {
  const baseSchema = DEFAULT_BASE_SCHEMA.replace('{{PROVIDER}}', config.provider);
  
  // Extract user relations from models
  const userRelations: string[] = [];
  const modelSchemas: string[] = [];
  
  for (const model of models) {
    // Check if model has relation to User
    const userRelationField = model.fields.find(f => 
      f.relation?.model === 'User' || f.type === 'User'
    );
    
    if (userRelationField) {
      userRelations.push(`${model.name.toLowerCase()}s ${model.name}[]`);
    }
    
    modelSchemas.push(generateModelSchema(model));
  }
  
  const finalBaseSchema = baseSchema.replace(
    '{{USER_RELATIONS}}',
    userRelations.join('\n  ')
  );
  
  return [finalBaseSchema, ...modelSchemas].join('\n\n');
}

/**
 * Generate a single model schema
 */
function generateModelSchema(model: ModelDefinition): string {
  const fields = model.fields.map(field => {
    let fieldLine = `  ${field.name} ${field.type}`;
    
    if (field.isOptional) {
      fieldLine += '?';
    }
    
    if (field.isId) {
      fieldLine += ' @id @default(cuid())';
    }
    
    if (field.isUnique && !field.isId) {
      fieldLine += ' @unique';
    }
    
    if (field.defaultValue) {
      fieldLine += ` @default(${field.defaultValue})`;
    }
    
    if (field.relation) {
      fieldLine += ` @relation(fields: [${field.name}Id], references: [${field.relation.field}])`;
    }
    
    return fieldLine;
  });
  
  // Add timestamp fields if not present
  const hasCreatedAt = model.fields.some(f => f.name === 'createdAt');
  const hasUpdatedAt = model.fields.some(f => f.name === 'updatedAt');
  const hasDeletedAt = model.fields.some(f => f.name === 'deletedAt');
  
  if (!hasCreatedAt) {
    fields.push('  createdAt DateTime @default(now())');
  }
  if (!hasUpdatedAt) {
    fields.push('  updatedAt DateTime @updatedAt');
  }
  if (!hasDeletedAt) {
    fields.push('  deletedAt DateTime?');
  }
  
  return `model ${model.name} {\n${fields.join('\n')}\n}`;
}

/**
 * Extract model definitions from a natural language prompt using AI
 * This is a placeholder - in production this would call an LLM
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function extractSchemaFromPrompt(
  prompt: string,
  _options: { useAI?: boolean } = {}
): Promise<ModelDefinition[]> {
  // Default models for common app types
  const promptLower = prompt.toLowerCase();
  
  // Extract nouns as potential models
  const commonModels: Record<string, ModelDefinition[]> = {
    'blog': [{
      name: 'Post',
      fields: [
        { name: 'id', type: 'String', isId: true },
        { name: 'title', type: 'String' },
        { name: 'content', type: 'String', isOptional: true },
        { name: 'published', type: 'Boolean', defaultValue: 'false' },
        { name: 'author', type: 'User', relation: { model: 'User', field: 'id' } },
        { name: 'authorId', type: 'String' },
      ]
    }, {
      name: 'Category',
      fields: [
        { name: 'id', type: 'String', isId: true },
        { name: 'name', type: 'String' },
        { name: 'slug', type: 'String', isUnique: true },
      ]
    }],
    'task': [{
      name: 'Task',
      fields: [
        { name: 'id', type: 'String', isId: true },
        { name: 'title', type: 'String' },
        { name: 'description', type: 'String', isOptional: true },
        { name: 'status', type: 'String', defaultValue: '"pending"' },
        { name: 'priority', type: 'String', defaultValue: '"medium"' },
        { name: 'dueDate', type: 'DateTime', isOptional: true },
        { name: 'assignee', type: 'User', relation: { model: 'User', field: 'id' } },
        { name: 'assigneeId', type: 'String' },
      ]
    }, {
      name: 'Project',
      fields: [
        { name: 'id', type: 'String', isId: true },
        { name: 'name', type: 'String' },
        { name: 'description', type: 'String', isOptional: true },
        { name: 'color', type: 'String', isOptional: true },
      ]
    }],
    'e-commerce': [{
      name: 'Product',
      fields: [
        { name: 'id', type: 'String', isId: true },
        { name: 'name', type: 'String' },
        { name: 'description', type: 'String', isOptional: true },
        { name: 'price', type: 'Decimal' },
        { name: 'stock', type: 'Int', defaultValue: '0' },
        { name: 'sku', type: 'String', isUnique: true },
        { name: 'images', type: 'String', isOptional: true },
      ]
    }, {
      name: 'Order',
      fields: [
        { name: 'id', type: 'String', isId: true },
        { name: 'status', type: 'String', defaultValue: '"pending"' },
        { name: 'total', type: 'Decimal' },
        { name: 'customer', type: 'User', relation: { model: 'User', field: 'id' } },
        { name: 'customerId', type: 'String' },
      ]
    }, {
      name: 'OrderItem',
      fields: [
        { name: 'id', type: 'String', isId: true },
        { name: 'quantity', type: 'Int' },
        { name: 'price', type: 'Decimal' },
        { name: 'orderId', type: 'String' },
        { name: 'productId', type: 'String' },
      ]
    }],
    'crm': [{
      name: 'Contact',
      fields: [
        { name: 'id', type: 'String', isId: true },
        { name: 'firstName', type: 'String' },
        { name: 'lastName', type: 'String' },
        { name: 'email', type: 'String' },
        { name: 'phone', type: 'String', isOptional: true },
        { name: 'company', type: 'String', isOptional: true },
        { name: 'notes', type: 'String', isOptional: true },
      ]
    }, {
      name: 'Deal',
      fields: [
        { name: 'id', type: 'String', isId: true },
        { name: 'name', type: 'String' },
        { name: 'value', type: 'Decimal', isOptional: true },
        { name: 'stage', type: 'String', defaultValue: '"lead"' },
        { name: 'contactId', type: 'String' },
      ]
    }],
  };
  
  // Match prompt keywords to models
  for (const [keyword, models] of Object.entries(commonModels)) {
    if (promptLower.includes(keyword)) {
      return models;
    }
  }
  
  // Default: extract potential entity names from prompt
  const words = prompt.split(/\s+/);
  const potentialModels = words.filter(w => 
    w.length > 3 && 
    !['create', 'build', 'with', 'using', 'that', 'this', 'from', 'have'].includes(w.toLowerCase())
  );
  
  if (potentialModels.length > 0) {
    // Create a generic model based on the first meaningful word
    const modelName = potentialModels[0].charAt(0).toUpperCase() + potentialModels[0].slice(1).toLowerCase();
    return [{
      name: modelName,
      fields: [
        { name: 'id', type: 'String', isId: true },
        { name: 'name', type: 'String' },
        { name: 'description', type: 'String', isOptional: true },
      ]
    }];
  }
  
  return [];
}

/**
 * Merge base auth schema with app-specific models
 */
export function mergeSchemas(baseSchema: string, appSchema: string): string {
  // Split and combine, ensuring no duplicate model definitions
  const baseModels = extractModels(baseSchema);
  const appModels = extractModels(appSchema);
  
  // Remove duplicates (base models take precedence)
  const uniqueAppModels = appModels.filter(m => !baseModels.some(bm => bm.name === m.name));
  
  return baseSchema + '\n\n' + uniqueAppModels.map(m => generateModelSchema(m)).join('\n\n');
}

/**
 * Extract model definitions from a schema string
 */
function extractModels(schema: string): ModelDefinition[] {
  const models: ModelDefinition[] = [];
  const modelRegex = /model\s+(\w+)\s*\{([^}]+)\}/g;
  let match;
  
  while ((match = modelRegex.exec(schema)) !== null) {
    const name = match[1];
    const fieldsContent = match[2].trim();
    const fields: ModelField[] = [];
    
    const fieldLines = fieldsContent.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('@@'));
    
    for (const line of fieldLines) {
      const parts = line.split(/\s+/);
      if (parts.length >= 2) {
        fields.push({
          name: parts[0],
          type: parts[1].replace('?', ''),
          isOptional: parts[1].includes('?'),
        });
      }
    }
    
    models.push({ name, fields });
  }
  
  return models;
}

/**
 * Generate environment variables template for the schema
 */
export function generateEnvTemplate(provider: string): string {
  const templates: Record<string, string> = {
    sqlite: 'DATABASE_URL="file:./dev.db"',
    postgresql: 'DATABASE_URL="postgresql://user:password@localhost:5432/mydb"',
    mysql: 'DATABASE_URL="mysql://user:password@localhost:3306/mydb"',
  };
  
  return `# Database Configuration
${templates[provider] || templates.sqlite}

# Authentication (NextAuth.js)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-change-in-production"

# OAuth Providers (Optional)
# GOOGLE_CLIENT_ID=""
# GOOGLE_CLIENT_SECRET=""
# GITHUB_CLIENT_ID=""
# GITHUB_CLIENT_SECRET=""`;
}

export default {
  generatePrismaSchema,
  extractSchemaFromPrompt,
  mergeSchemas,
  generateEnvTemplate,
};