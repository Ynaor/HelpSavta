# Road to Production Guide - HelpSavta Technical Help Platform

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Critical Security Fixes (Must Complete Before Launch)](#critical-security-fixes)
3. [Infrastructure Setup for Azure](#infrastructure-setup-for-azure)
4. [Database Migration & Management](#database-migration--management)
5. [CI/CD Pipeline Implementation](#cicd-pipeline-implementation)
6. [Monitoring, Logging & Analytics](#monitoring-logging--analytics)
7. [Performance & Scalability](#performance--scalability)
8. [Security Review Checklist](#security-review-checklist)
9. [Go-Live Checklist](#go-live-checklist)
10. [Post-Production Maintenance](#post-production-maintenance)

---

## Executive Summary

### Production Readiness Assessment

**Current State:**
- ✅ Full-stack application with React frontend and Node.js backend
- ✅ Database schema defined with Prisma ORM
- ✅ Basic authentication and session management
- ✅ Email service integration
- ✅ Rate limiting and basic security middleware
- ❌ Using SQLite (development database)
- ❌ Hardcoded credentials in codebase
- ❌ No production environment configuration
- ❌ No deployment pipeline
- ❌ No monitoring or logging

### Timeline and Priority Breakdown

**Phase 1: Critical Security & Infrastructure (Week 1-2)**
- Remove hardcoded credentials
- Set up Azure infrastructure
- Database migration to PostgreSQL
- Basic CI/CD pipeline

**Phase 2: Production Hardening (Week 3-4)**
- Security audit and fixes
- Monitoring and logging setup
- Performance optimization
- Testing and staging environment

**Phase 3: Go-Live Preparation (Week 5)**
- Final security review
- Load testing
- Documentation and runbooks
- Launch preparation

### Cost Estimation (Monthly Azure Costs)
- **App Service Plan (Standard S1):** ~$70/month
- **Azure Database for PostgreSQL (Basic):** ~$25/month
- **Redis Cache (Basic):** ~$20/month
- **Application Insights:** ~$5/month
- **Storage Account:** ~$5/month
- **Total Estimated:** ~$125/month

---

## Critical Security Fixes (Must Complete Before Launch)

### 1. Remove Hardcoded Credentials and Secrets

**Current Issues:**
```javascript
// backend/.env.example - Line 26
EMAIL_PASS="vjir cjdm zejv ejmr"  // ❌ Hardcoded email password

// backend/.env.example - Lines 19-20
DEFAULT_ADMIN_USERNAME=admin       // ❌ Default credentials
DEFAULT_ADMIN_PASSWORD=admin123
```

**Action Items:**

#### 1.1 Environment Variable Management
Create production environment files:

```bash
# backend/.env.production
DATABASE_URL="postgresql://username:password@server:5432/helpsavta_prod"
SESSION_SECRET="generate-strong-32-char-secret-here"
EMAIL_PASS="use-azure-app-password-or-sendgrid"
DEFAULT_ADMIN_PASSWORD="generate-strong-password"
```

#### 1.2 Azure Key Vault Integration
```bash
# Install Azure Key Vault client
npm install @azure/keyvault-secrets @azure/identity
```

Update [`backend/src/server.ts`](backend/src/server.ts:1):
```typescript
import { SecretClient } from '@azure/keyvault-secrets';
import { DefaultAzureCredential } from '@azure/identity';

// Azure Key Vault setup
const credential = new DefaultAzureCredential();
const vaultName = process.env.AZURE_KEY_VAULT_NAME;
const url = `https://${vaultName}.vault.azure.net`;
const client = new SecretClient(url, credential);

// Load secrets
const sessionSecret = await client.getSecret('session-secret');
const emailPassword = await client.getSecret('email-password');
```

### 2. Implement Proper Environment Variable Management

#### 2.1 Environment-Specific Configuration
Create [`backend/src/config/environment.ts`](backend/src/config/environment.ts:1):
```typescript
export interface EnvironmentConfig {
  database: {
    url: string;
    ssl: boolean;
    maxConnections: number;
  };
  server: {
    port: number;
    corsOrigins: string[];
    sessionSecret: string;
  };
  email: {
    host: string;
    port: number;
    user: string;
    password: string;
  };
  monitoring: {
    applicationInsightsKey: string;
  };
}

export const getEnvironmentConfig = (): EnvironmentConfig => {
  const env = process.env.NODE_ENV || 'development';
  
  if (env === 'production') {
    return {
      database: {
        url: process.env.DATABASE_URL!,
        ssl: true,
        maxConnections: 20,
      },
      server: {
        port: parseInt(process.env.PORT || '8080'),
        corsOrigins: [process.env.FRONTEND_URL!],
        sessionSecret: process.env.SESSION_SECRET!,
      },
      email: {
        host: process.env.EMAIL_HOST!,
        port: parseInt(process.env.EMAIL_PORT!),
        user: process.env.EMAIL_USER!,
        password: process.env.EMAIL_PASS!,
      },
      monitoring: {
        applicationInsightsKey: process.env.APPINSIGHTS_INSTRUMENTATIONKEY!,
      },
    };
  }
  
  // Development configuration
  return require('./development.config.json');
};
```

### 3. Set up Production-Grade Authentication

#### 3.1 Enhanced Password Security
Update [`backend/src/middleware/auth.ts`](backend/src/middleware/auth.ts:1):
```typescript
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';

// Strong password requirements
export const passwordRequirements = {
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
};

// Enhanced password hashing
export const hashPassword = async (password: string): Promise<string> => {
  // Use cost factor of 12 for production
  return bcrypt.hash(password, 12);
};

// Login rate limiting
export const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: 'Too many login attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});
```

#### 3.2 Session Security Enhancement
```typescript
// Production session configuration
app.use(session({
  secret: config.server.sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'strict',
  },
  store: new RedisStore({
    client: redisClient,
    prefix: 'helpsavta:',
  }),
}));
```

### 4. Database Security Improvements

#### 4.1 Connection Security
Update [`backend/prisma/schema.prisma`](backend/prisma/schema.prisma:8):
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  // Add connection pooling and SSL
  shadowDatabaseUrl = env("SHADOW_DATABASE_URL")
}
```

#### 4.2 Database Connection Pooling
```typescript
// backend/src/config/database.ts
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Connection pool configuration for production
if (process.env.NODE_ENV === 'production') {
  // Configure connection pooling
  process.env.DATABASE_URL += '?connection_limit=20&pool_timeout=20';
}
```

### 5. API Security Enhancements

#### 5.1 Input Validation
Enhance [`backend/src/middleware/validation.ts`](backend/src/middleware/validation.ts:1):
```typescript
import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';

// Hebrew text validation
const hebrewTextSchema = Joi.string()
  .pattern(/^[\u0590-\u05FF\s\d\p{P}a-zA-Z]*$/, 'unicode')
  .min(1)
  .max(500);

export const validateTechRequest = (req: Request, res: Response, next: NextFunction) => {
  const schema = Joi.object({
    full_name: hebrewTextSchema.required(),
    phone: Joi.string().pattern(/^05\d{8}$/).required(), // Israeli mobile format
    email: Joi.string().email().required(),
    address: hebrewTextSchema.required(),
    problem_description: hebrewTextSchema.min(10).max(1000).required(),
    urgency_level: Joi.string().valid('low', 'medium', 'high', 'urgent').default('medium'),
  });

  const { error, value } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  
  req.body = value;
  next();
};
```

---

## Infrastructure Setup for Azure

### 1. Azure Services Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Azure CDN     │────│ Azure App Service│────│ PostgreSQL DB   │
│  (Static Assets)│    │   (Frontend +    │    │  (Primary Data) │
└─────────────────┘    │    Backend)      │    └─────────────────┘
                       └──────────────────┘              │
                                │                        │
                       ┌──────────────────┐              │
                       │   Redis Cache    │              │
                       │  (Sessions +     │              │
                       │   Caching)       │              │
                       └──────────────────┘              │
                                │                        │
                       ┌──────────────────┐              │
                       │ Application      │              │
                       │   Insights       │              │
                       │ (Monitoring)     │              │
                       └──────────────────┘              │
                                │                        │
                       ┌──────────────────┐              │
                       │  Key Vault       │──────────────┘
                       │  (Secrets)       │
                       └──────────────────┘
```

### 2. Step-by-Step Azure Resource Creation

#### 2.1 Create Resource Group
```bash
# Login to Azure CLI
az login

# Create resource group
az group create \
  --name helpsavta-prod-rg \
  --location "West Europe" \
  --tags environment=production project=helpsavta
```

#### 2.2 Create PostgreSQL Database
```bash
# Create PostgreSQL server
az postgres server create \
  --resource-group helpsavta-prod-rg \
  --name helpsavta-db-server \
  --location "West Europe" \
  --admin-user helpsavta_admin \
  --admin-password "$(openssl rand -base64 32)" \
  --sku-name B_Gen5_1 \
  --storage-size 5120 \
  --version 13

# Create database
az postgres db create \
  --resource-group helpsavta-prod-rg \
  --server-name helpsavta-db-server \
  --name helpsavta_prod

# Configure firewall (allow Azure services)
az postgres server firewall-rule create \
  --resource-group helpsavta-prod-rg \
  --server helpsavta-db-server \
  --name AllowAzureServices \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0
```

#### 2.3 Create Redis Cache
```bash
az redis create \
  --resource-group helpsavta-prod-rg \
  --name helpsavta-redis \
  --location "West Europe" \
  --sku Basic \
  --vm-size c0
```

#### 2.4 Create Key Vault
```bash
az keyvault create \
  --resource-group helpsavta-prod-rg \
  --name helpsavta-keyvault \
  --location "West Europe" \
  --sku standard
```

#### 2.5 Create App Service Plan
```bash
az appservice plan create \
  --resource-group helpsavta-prod-rg \
  --name helpsavta-app-plan \
  --location "West Europe" \
  --sku S1 \
  --is-linux
```

#### 2.6 Create App Service
```bash
az webapp create \
  --resource-group helpsavta-prod-rg \
  --plan helpsavta-app-plan \
  --name helpsavta-app \
  --runtime "NODE|18-lts" \
  --startup-file "npm start"
```

### 3. Configuration for Production Environment

#### 3.1 App Service Configuration
```bash
# Set environment variables
az webapp config appsettings set \
  --resource-group helpsavta-prod-rg \
  --name helpsavta-app \
  --settings \
    NODE_ENV=production \
    DATABASE_URL="postgresql://helpsavta_admin:password@helpsavta-db-server.postgres.database.azure.com:5432/helpsavta_prod?sslmode=require" \
    REDIS_URL="rediss://helpsavta-redis.redis.cache.windows.net:6380" \
    FRONTEND_URL="https://helpsavta-app.azurewebsites.net" \
    AZURE_KEY_VAULT_NAME="helpsavta-keyvault"

# Enable Application Insights
az monitor app-insights component create \
  --resource-group helpsavta-prod-rg \
  --app helpsavta-insights \
  --location "West Europe" \
  --application-type web

# Link to App Service
APPINSIGHTS_KEY=$(az monitor app-insights component show \
  --resource-group helpsavta-prod-rg \
  --app helpsavta-insights \
  --query instrumentationKey -o tsv)

az webapp config appsettings set \
  --resource-group helpsavta-prod-rg \
  --name helpsavta-app \
  --settings APPINSIGHTS_INSTRUMENTATIONKEY=$APPINSIGHTS_KEY
```

### 4. DNS and SSL Certificate Setup

#### 4.1 Custom Domain Configuration
```bash
# Add custom domain
az webapp config hostname add \
  --resource-group helpsavta-prod-rg \
  --webapp-name helpsavta-app \
  --hostname helpsavta.org

# Enable managed certificate
az webapp config ssl bind \
  --resource-group helpsavta-prod-rg \
  --name helpsavta-app \
  --certificate-thumbprint auto \
  --ssl-type SNI
```

#### 4.2 DNS Configuration
Create the following DNS records:
```
A     @     20.54.xxx.xxx     (App Service IP)
CNAME www   helpsavta-app.azurewebsites.net
TXT   @     "verification-string-from-azure"
```

### 5. Cost Monitoring Setup

#### 5.1 Budget Alerts
```bash
# Create budget
az consumption budget create \
  --resource-group helpsavta-prod-rg \
  --budget-name helpsavta-monthly-budget \
  --amount 200 \
  --time-grain Monthly \
  --time-period start-date=2024-01-01 \
  --category Cost
```

---

## Database Migration & Management

### 1. PostgreSQL Setup on Azure

#### 1.1 Connection Configuration
Create [`backend/src/config/database.production.ts`](backend/src/config/database.production.ts:1):
```typescript
import { PrismaClient } from '@prisma/client';

export const createProductionPrismaClient = () => {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  return new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
    log: ['error', 'warn'],
    errorFormat: 'minimal',
  });
};

// Connection pool settings for Azure PostgreSQL
export const connectionPoolConfig = {
  // Azure PostgreSQL supports up to 97 connections for Basic tier
  maxConnections: 20,
  idleTimeout: 30000,
  connectionTimeout: 10000,
};
```

### 2. Migration from SQLite to PostgreSQL

#### 2.1 Update Prisma Schema
Update [`backend/prisma/schema.prisma`](backend/prisma/schema.prisma:8):
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Update all models to use proper PostgreSQL types
model TechRequest {
  id                  Int       @id @default(autoincrement())
  full_name          String    @db.VarChar(255)
  phone              String    @db.VarChar(20)
  email              String    @db.VarChar(255)
  address            String    @db.Text
  problem_description String   @db.Text
  urgency_level      String    @default("medium") @db.VarChar(20)
  scheduled_date     String?   @db.VarChar(10)  // YYYY-MM-DD
  scheduled_time     String?   @db.VarChar(8)   // HH:MM:SS
  status             String    @default("pending") @db.VarChar(20)
  notes              String?   @db.Text
  assigned_admin_id  Int?
  created_at         DateTime  @default(now()) @db.Timestamptz
  updated_at         DateTime  @updatedAt @db.Timestamptz
  
  booked_slot        AvailableSlot?  @relation(fields: [booked_slot_id], references: [id])
  booked_slot_id     Int?
  assigned_admin     AdminUser?      @relation(fields: [assigned_admin_id], references: [id])

  // Add indexes for performance
  @@index([status])
  @@index([urgency_level])
  @@index([created_at])
  @@map("tech_requests")
}

model AvailableSlot {
  id                 Int       @id @default(autoincrement())
  date               String    @db.VarChar(10)  // YYYY-MM-DD
  start_time         String    @db.VarChar(8)   // HH:MM:SS
  end_time           String    @db.VarChar(8)   // HH:MM:SS
  is_booked          Boolean   @default(false)
  created_at         DateTime  @default(now()) @db.Timestamptz
  updated_at         DateTime  @updatedAt @db.Timestamptz
  
  tech_requests      TechRequest[]

  @@index([date, is_booked])
  @@map("available_slots")
}

model AdminUser {
  id              Int        @id @default(autoincrement())
  username        String     @unique @db.VarChar(50)
  password_hash   String     @db.VarChar(255)
  role            String     @default("VOLUNTEER") @db.VarChar(20)
  created_by_id   Int?
  is_active       Boolean    @default(true)
  created_at      DateTime   @default(now()) @db.Timestamptz
  updated_at      DateTime   @updatedAt @db.Timestamptz

  created_by      AdminUser?  @relation("AdminCreatedBy", fields: [created_by_id], references: [id])
  created_admins  AdminUser[] @relation("AdminCreatedBy")
  assigned_requests TechRequest[]

  @@index([username])
  @@index([is_active])
  @@map("admin_users")
}

model NotificationLog {
  id        Int      @id @default(autoincrement())
  type      String   @db.VarChar(20)
  recipient String   @db.VarChar(255)
  message   String   @db.Text
  sent_at   DateTime @default(now()) @db.Timestamptz
  status    String   @default("pending") @db.VarChar(20)

  @@index([sent_at])
  @@index([status])
  @@map("notification_logs")
}
```

#### 2.2 Migration Script
Create [`backend/scripts/migrate-to-postgresql.ts`](backend/scripts/migrate-to-postgresql.ts:1):
```typescript
import { PrismaClient as SqlitePrismaClient } from '@prisma/client';
import { PrismaClient as PostgreSQLPrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env' }); // SQLite
dotenv.config({ path: '.env.production' }); // PostgreSQL

async function migrateData() {
  // Connect to SQLite (source)
  const sqliteClient = new SqlitePrismaClient({
    datasources: {
      db: {
        url: 'file:./dev.db',
      },
    },
  });

  // Connect to PostgreSQL (destination)
  const postgresClient = new PostgreSQLPrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

  try {
    console.log('Starting migration...');

    // Migrate admin users first (due to foreign key constraints)
    console.log('Migrating admin users...');
    const adminUsers = await sqliteClient.adminUser.findMany();
    
    // Create root admins first (those without created_by_id)
    const rootAdmins = adminUsers.filter(user => !user.created_by_id);
    for (const admin of rootAdmins) {
      await postgresClient.adminUser.create({
        data: {
          id: admin.id,
          username: admin.username,
          password_hash: admin.password_hash,
          role: admin.role,
          is_active: admin.is_active,
          created_at: admin.created_at,
          updated_at: admin.updated_at,
        },
      });
    }

    // Create child admins
    const childAdmins = adminUsers.filter(user => user.created_by_id);
    for (const admin of childAdmins) {
      await postgresClient.adminUser.create({
        data: {
          id: admin.id,
          username: admin.username,
          password_hash: admin.password_hash,
          role: admin.role,
          created_by_id: admin.created_by_id,
          is_active: admin.is_active,
          created_at: admin.created_at,
          updated_at: admin.updated_at,
        },
      });
    }

    // Migrate available slots
    console.log('Migrating available slots...');
    const slots = await sqliteClient.availableSlot.findMany();
    for (const slot of slots) {
      await postgresClient.availableSlot.create({
        data: {
          id: slot.id,
          date: slot.date,
          start_time: slot.start_time,
          end_time: slot.end_time,
          is_booked: slot.is_booked,
          created_at: slot.created_at,
          updated_at: slot.updated_at,
        },
      });
    }

    // Migrate tech requests
    console.log('Migrating tech requests...');
    const requests = await sqliteClient.techRequest.findMany();
    for (const request of requests) {
      await postgresClient.techRequest.create({
        data: {
          id: request.id,
          full_name: request.full_name,
          phone: request.phone,
          email: request.email,
          address: request.address,
          problem_description: request.problem_description,
          urgency_level: request.urgency_level,
          scheduled_date: request.scheduled_date,
          scheduled_time: request.scheduled_time,
          status: request.status,
          notes: request.notes,
          assigned_admin_id: request.assigned_admin_id,
          booked_slot_id: request.booked_slot_id,
          created_at: request.created_at,
          updated_at: request.updated_at,
        },
      });
    }

    // Migrate notification logs
    console.log('Migrating notification logs...');
    const notifications = await sqliteClient.notificationLog.findMany();
    for (const notification of notifications) {
      await postgresClient.notificationLog.create({
        data: {
          id: notification.id,
          type: notification.type,
          recipient: notification.recipient,
          message: notification.message,
          sent_at: notification.sent_at,
          status: notification.status,
        },
      });
    }

    console.log('Migration completed successfully!');

  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await sqliteClient.$disconnect();
    await postgresClient.$disconnect();
  }
}

// Run migration
migrateData()
  .then(() => {
    console.log('Migration script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration script failed:', error);
    process.exit(1);
  });
```

#### 2.3 Migration Execution Steps
```bash
# 1. Generate PostgreSQL client
npm run db:generate

# 2. Push schema to PostgreSQL (creates tables)
npm run db:push

# 3. Run migration script
npx ts-node scripts/migrate-to-postgresql.ts

# 4. Verify migration
npm run db:studio
```

### 3. Backup and Disaster Recovery Strategy

#### 3.1 Automated Backups
Create [`backend/scripts/backup-database.ts`](backend/scripts/backup-database.ts:1):
```typescript
import { exec } from 'child_process';
import { promisify } from 'util';
import * as dotenv from 'dotenv';

dotenv.config();

const execAsync = promisify(exec);

async function createBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = `backup-${timestamp}.sql`;
  
  const command = `pg_dump "${process.env.DATABASE_URL}" > ./backups/${backupFile}`;
  
  try {
    await execAsync(command);
    console.log(`Backup created successfully: ${backupFile}`);
    
    // Upload to Azure Blob Storage
    await uploadToAzureStorage(backupFile);
    
  } catch (error) {
    console.error('Backup failed:', error);
    throw error;
  }
}

async function uploadToAzureStorage(backupFile: string) {
  // Implementation for Azure Blob Storage upload
  const { BlobServiceClient } = require('@azure/storage-blob');
  
  const blobServiceClient = BlobServiceClient.fromConnectionString(
    process.env.AZURE_STORAGE_CONNECTION_STRING!
  );
  
  const containerClient = blobServiceClient.getContainerClient('database-backups');
  const blockBlobClient = containerClient.getBlockBlobClient(backupFile);
  
  await blockBlobClient.uploadFile(`./backups/${backupFile}`);
  console.log(`Backup uploaded to Azure Storage: ${backupFile}`);
}

// Schedule daily backups
if (require.main === module) {
  createBackup();
}
```

### 4. Connection Pooling and Performance Optimization

#### 4.1 Database Optimization
```sql
-- Create indexes for better performance
CREATE INDEX CONCURRENTLY idx_tech_requests_status_created ON tech_requests(status, created_at DESC);
CREATE INDEX CONCURRENTLY idx_tech_requests_urgency ON tech_requests(urgency_level) WHERE status = 'pending';
CREATE INDEX CONCURRENTLY idx_available_slots_date_booked ON available_slots(date, is_booked);
CREATE INDEX CONCURRENTLY idx_notification_logs_sent_at ON notification_logs(sent_at DESC);

-- Add partial indexes for common queries
CREATE INDEX CONCURRENTLY idx_tech_requests_pending ON tech_requests(created_at DESC) WHERE status = 'pending';
CREATE INDEX CONCURRENTLY idx_admin_users_active ON admin_users(username) WHERE is_active = true;
```

---

## CI/CD Pipeline Implementation

### 1. GitHub Actions Workflow

#### 1.1 Main Deployment Workflow
Create [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml:1):
```yaml
name: Deploy to Azure

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

env:
  AZURE_WEBAPP_NAME: helpsavta-app
  NODE_VERSION: '18.x'

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:13
        env:
          POSTGRES_PASSWORD: test_password
          POSTGRES_DB: helpsavta_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: ${{ env.NODE_VERSION }}
        cache: 'npm'
    
    - name: Install dependencies
      run: |
        npm ci
        cd backend && npm ci
        cd ../frontend && npm ci
    
    - name: Run linting
      run: npm run lint
    
    - name: Run backend tests
      env:
        DATABASE_URL: postgresql://postgres:test_password@localhost:5432/helpsavta_test
      run: |
        cd backend
        npm run db:push
        npm test
    
    - name: Run frontend tests
      run: |
        cd frontend
        npm test -- --watchAll=false
    
    - name: Build application
      run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: ${{ env.NODE_VERSION }}
        cache: 'npm'
    
    - name: Install dependencies and build
      run: |
        npm ci
        npm run build
    
    - name: Run database migration
      env:
        DATABASE_URL: ${{ secrets.DATABASE_URL }}
      run: |
        cd backend
        npm run db:generate
        npm run db:migrate deploy
    
    - name: Deploy to Azure Web App
      uses: azure/webapps-deploy@v2
      with:
        app-name: ${{ env.AZURE_WEBAPP_NAME }}
        publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
        package: .

  notify:
    needs: [test, deploy]
    runs-on: ubuntu-latest
    if: always()
    
    steps:
    - name: Notify deployment status
      uses: 8398a7/action-slack@v3
      with:
        status: ${{ job.status }}
        webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### 2. Environment-Specific Deployments

#### 2.1 Environment Configuration
Create [`deployment/environments/production.json`](deployment/environments/production.json:1):
```json
{
  "environment": "production",
  "appSettings": {
    "NODE_ENV": "production",
    "PORT": "8080",
    "DATABASE_URL": "@Microsoft.KeyVault(VaultName=helpsavta-keyvault;SecretName=database-url)",
    "SESSION_SECRET": "@Microsoft.KeyVault(VaultName=helpsavta-keyvault;SecretName=session-secret)",
    "EMAIL_PASS": "@Microsoft.KeyVault(VaultName=helpsavta-keyvault;SecretName=email-password)",
    "REDIS_URL": "@Microsoft.KeyVault(VaultName=helpsavta-keyvault;SecretName=redis-url)",
    "FRONTEND_URL": "https://helpsavta.org",
    "APPINSIGHTS_INSTRUMENTATIONKEY": "@Microsoft.KeyVault(VaultName=helpsavta-keyvault;SecretName=appinsights-key)"
  }
}
```

### 3. Rollback Strategies

#### 3.1 Blue-Green Deployment
```bash
# Create staging slot
az webapp deployment slot create \
  --resource-group helpsavta-prod-rg \
  --name helpsavta-app \
  --slot staging

# Deploy to staging slot first
# Test staging slot
# Swap staging to production
az webapp deployment slot swap \
  --resource-group helpsavta-prod-rg \
  --name helpsavta-app \
  --slot staging \
  --target-slot production
```

---

## Monitoring, Logging & Analytics

### 1. Application Performance Monitoring Setup

#### 1.1 Application Insights Integration
Create [`backend/src/config/monitoring.ts`](backend/src/config/monitoring.ts:1):
```typescript
import * as appInsights from 'applicationinsights';

export function setupApplicationInsights() {
  if (process.env.APPINSIGHTS_INSTRUMENTATIONKEY) {
    appInsights.setup(process.env.APPINSIGHTS_INSTRUMENTATIONKEY)
      .setAutoDependencyCorrelation(true)
      .setAutoCollectRequests(true)
      .setAutoCollectPerformance(true, true)
      .setAutoCollectExceptions(true)
      .setAutoCollectDependencies(true)
      .setAutoCollectConsole(true)
      .setUseDiskRetryCaching(true)
      .setSendLiveMetrics(true)
      .start();

    return appInsights.defaultClient;
  }
  return null;
}

export function trackCustomEvent(name: string, properties?: any, measurements?: any) {
  const client = appInsights.defaultClient;
  if (client) {
    client.trackEvent({ name, properties, measurements });
  }
}

export function trackCustomMetric(name: string, value: number, properties?: any) {
  const client = appInsights.defaultClient;
  if (client) {
    client.trackMetric({ name, value, properties });
  }
}
```

### 2. User Analytics Implementation

#### 2.1 IP Tracking and Geolocation
Create [`backend/src/services/analyticsService.ts`](backend/src/services/analyticsService.ts:1):
```typescript
import { Request } from 'express';
import axios from 'axios';
import { trackCustomEvent } from '../config/monitoring';

interface UserAnalytics {
  ip: string;
  userAgent: string;
  city?: string;
  country?: string;
  timestamp: Date;
  page?: string;
}

export class AnalyticsService {
  private async getLocationFromIP(ip: string): Promise<{ city?: string; country?: string }> {
    try {
      const response = await axios.get(`http://ip-api.com/json/${ip}`, {
        timeout: 5000,
      });
      
      if (response.data.status === 'success') {
        return {
          city: response.data.city,
          country: response.data.country,
        };
      }
    } catch (error) {
      console.error('Failed to get location from IP:', error);
    }
    
    return {};
  }

  public async trackUserVisit(req: Request, page?: string): Promise<void> {
    const ip = this.getClientIP(req);
    const userAgent = req.get('user-agent') || '';
    
    try {
      const location = await this.getLocationFromIP(ip);
      
      const analytics: UserAnalytics = {
        ip,
        userAgent,
        city: location.city,
        country: location.country,
        timestamp: new Date(),
        page,
      };

      // Track in Application Insights
      trackCustomEvent('user_visit', {
        ip: ip.slice(0, -1) + 'x', // Anonymize last octet for privacy
        city: analytics.city,
        country: analytics.country,
        userAgent: analytics.userAgent,
        page: analytics.page,
        timestamp: analytics.timestamp.toISOString(),
      });
      
    } catch (error) {
      console.error('Error tracking user visit:', error);
    }
  }

  private getClientIP(req: Request): string {
    return (
      req.headers['x-forwarded-for'] as string ||
      req.headers['x-real-ip'] as string ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      '0.0.0.0'
    ).split(',')[0].trim();
  }
}

export const analyticsService = new AnalyticsService();
```

### 3. Error Tracking and Alerting

#### 3.1 Enhanced Error Handler
Update [`backend/src/middleware/errorHandler.ts`](backend/src/middleware/errorHandler.ts:1):
```typescript
import { Request, Response, NextFunction } from 'express';
import { trackCustomEvent } from '../config/monitoring';

export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // Log error details
  console.error('Error occurred:', {
    message: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
  });

  // Track error in Application Insights
  trackCustomEvent('application_error', {
    message: error.message,
    path: req.path,
    method: req.method,
    statusCode: error.statusCode || 500,
    userAgent: req.get('user-agent'),
    timestamp: new Date().toISOString(),
  });

  const statusCode = error.statusCode || 500;
  const message = statusCode === 500 ? 'Internal server error' : error.message;

  res.status(statusCode).json({
    error: message,
    timestamp: new Date().toISOString(),
    path: req.path,
    ...(isDevelopment && { stack: error.stack }),
  });
};
```

---

## Performance & Scalability

### 1. Caching Strategies

#### 1.1 Redis Implementation
Create [`backend/src/config/redis.ts`](backend/src/config/redis.ts:1):
```typescript
import Redis from 'ioredis';

class CacheService {
  private redis: Redis;

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      retryDelayOnFailover: 100,
      enableReadyCheck: false,
      maxRetriesPerRequest: null,
    });

    this.redis.on('error', (error) => {
      console.error('Redis connection error:', error);
    });
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds: number = 3600): Promise<void> {
    try {
      await this.redis.setex(key, ttlSeconds, JSON.stringify(value));
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  async cacheAvailableSlots(date: string, slots: any[]): Promise<void> {
    await this.set(`slots:${date}`, slots, 1800); // 30 minutes
  }

  async getCachedAvailableSlots(date: string): Promise<any[] | null> {
    return this.get(`slots:${date}`);
  }
}

export const cacheService = new CacheService();
```

### 2. CDN Setup for Static Assets

#### 2.1 Azure CDN Configuration
```bash
# Create CDN profile
az cdn profile create \
  --resource-group helpsavta-prod-rg \
  --name helpsavta-cdn \
  --sku Standard_Microsoft

# Create CDN endpoint
az cdn endpoint create \
  --resource-group helpsavta-prod-rg \
  --profile-name helpsavta-cdn \
  --name helpsavta-static \
  --origin helpsavta-app.azurewebsites.net
```

### 3. Auto-scaling Configuration

#### 3.1 App Service Auto-scaling
```bash
# Create auto-scaling rule
az monitor autoscale create \
  --resource-group helpsavta-prod-rg \
  --resource helpsavta-app-plan \
  --resource-type Microsoft.Web/serverfarms \
  --name helpsavta-autoscale \
  --min-count 1 \
  --max-count 3 \
  --count 1

# Add scale-out rule
az monitor autoscale rule create \
  --resource-group helpsavta-prod-rg \
  --autoscale-name helpsavta-autoscale \
  --condition "Percentage CPU > 70 avg 5m" \
  --scale out 1
```

---

## Security Review Checklist

### 1. Application Security Audit

#### 1.1 Security Checklist
- [ ] **Authentication & Authorization**
  - [ ] Strong password requirements implemented
  - [ ] Session management secure (httpOnly, secure, sameSite)
  - [ ] Rate limiting on login endpoints
  - [ ] CSRF protection enabled
  - [ ] Session timeout configured

- [ ] **Data Protection**
  - [ ] All sensitive data encrypted at rest
  - [ ] Database connections use SSL
  - [ ] Input validation on all endpoints
  - [ ] Output encoding to prevent XSS
  - [ ] SQL injection prevention (using Prisma ORM)

- [ ] **Infrastructure Security**
  - [ ] HTTPS enforced (SSL certificates)
  - [ ] Security headers configured (Helmet.js)
  - [ ] CORS properly configured
  - [ ] Firewall rules in place
  - [ ] Regular security updates applied

- [ ] **Secrets Management**
  - [ ] No hardcoded secrets in code
  - [ ] Environment variables properly managed
  - [ ] Azure Key Vault integration
  - [ ] Secrets rotation strategy

### 2. GDPR Compliance Requirements

#### 2.1 Data Protection Implementation
```typescript
// backend/src/middleware/gdpr.ts
import { Request, Response, NextFunction } from 'express';

export const gdprCompliance = (req: Request, res: Response, next: NextFunction) => {
  // Log data processing activities
  if (req.method === 'POST' && req.path.includes('/api/requests')) {
    console.log('GDPR: Personal data collected', {
      timestamp: new Date().toISOString(),
      ip: req.ip,
      dataTypes: ['name', 'email', 'phone', 'address'],
      purpose: 'Technical assistance request',
      legalBasis: 'consent',
    });
  }

  next();
};

export const dataRetentionPolicy = {
  techRequests: '2 years', // Retain for service improvement
  completedRequests: '1 year', // Archive after completion
  userAnalytics: '6 months', // Anonymize after 6 months
  logs: '90 days', // Security and debugging
};
```

### 3. Rate Limiting and DDoS Protection

#### 3.1 Enhanced Rate Limiting
```typescript
// backend/src/middleware/rateLimiting.ts
import rateLimit from 'express-rate-limit';

export const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50, // stricter limit for API endpoints
  message: 'API rate limit exceeded',
});

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // very strict for auth endpoints
  message: 'Too many authentication attempts',
  skipSuccessfulRequests: true,
});
```

---

## Go-Live Checklist

### 1. Pre-Launch Verification Steps

#### 1.1 Technical Checklist
- [ ] **Infrastructure**
  - [ ] All Azure resources created and configured
  - [ ] DNS records configured and propagated
  - [ ] SSL certificates installed and valid
  - [ ] Load balancer configured (if applicable)
  - [ ] CDN configured for static assets

- [ ] **Database**
  - [ ] PostgreSQL database migrated and tested
  - [ ] Database backups scheduled and tested
  - [ ] Connection pooling configured
  - [ ] Performance indexes created

- [ ] **Application**
  - [ ] Production build created and tested
  - [ ] Environment variables configured
  - [ ] Monitoring and logging enabled
  - [ ] Error tracking configured
  - [ ] Health check endpoint responding

- [ ] **Security**
  - [ ] Security scan completed
  - [ ] Penetration testing performed
  - [ ] Secrets properly managed
  - [ ] HTTPS enforced
  - [ ] Security headers configured

### 2. Launch Day Procedures

#### 2.1 Go-Live Steps
1. **Final Deployment**
   ```bash
   # Final production deployment
   git checkout main
   git pull origin main
   
   # Trigger deployment pipeline
   git tag v1.0.0
   git push origin v1.0.0
   ```

2. **Database Final Migration**
   ```bash
   # Run final production migration
   npm run db:migrate deploy
   
   # Verify data integrity
   npm run db:verify
   ```

3. **Switch DNS to Production**
   ```bash
   # Update DNS to point to production
   # Monitor for 30 minutes before confirming
   ```

4. **Monitor Critical Metrics**
   - Response times < 2 seconds
   - Error rate < 1%
   - Database connections healthy
   - Memory usage < 80%
   - CPU usage < 70%

### 3. Post-Launch Monitoring

#### 3.1 First 24 Hours
- [ ] Monitor error rates every 15 minutes
- [ ] Check performance metrics hourly
- [ ] Verify all user flows working
- [ ] Monitor database performance
- [ ] Check backup systems
- [ ] Validate monitoring alerts

#### 3.2 First Week
- [ ] Daily performance reviews
- [ ] User feedback collection
- [ ] Security monitoring
- [ ] Capacity planning review
- [ ] Documentation updates

---

## Post-Production Maintenance

### 1. Ongoing Monitoring Procedures

#### 1.1 Daily Monitoring Tasks
- **Performance Metrics Review**
  - Application response times
  - Database query performance
  - Error rates and types
  - User activity patterns

- **System Health Checks**
  - Server resource utilization
  - Database connection pools
  - Cache hit rates
  - SSL certificate expiry dates

- **Security Monitoring**
  - Failed login attempts
  - Unusual traffic patterns
  - Security scan results
  - Access log analysis

### 2. Update and Patch Management

#### 2.1 Update Schedule
- **Security Updates**: Immediate (within 24 hours)
- **Dependency Updates**: Weekly review, monthly deployment
- **Feature Updates**: Bi-weekly releases
- **Database Schema Changes**: Monthly maintenance window

#### 2.2 Update Process
```bash
# 1. Test in staging environment
npm audit
npm update
npm run test

# 2. Deploy to staging
git checkout develop
git merge feature/updates
# Trigger staging deployment

# 3. Validate staging
npm run test:e2e

# 4. Deploy to production
git checkout main
git merge develop
# Trigger production deployment
```

### 3. Scaling Considerations

#### 3.1 Horizontal Scaling Triggers
- **CPU Usage > 70%** for 10+ minutes
- **Memory Usage > 85%** consistently
- **Response Time > 3 seconds** average
- **Database Connection Pool > 80%** utilized

#### 3.2 Scaling Actions
```bash
# Scale out App Service
az appservice plan update \
  --resource-group helpsavta-prod-rg \
  --name helpsavta-app-plan \
  --number-of-workers 3

# Scale up database if needed
az postgres server update \
  --resource-group helpsavta-prod-rg \
  --name helpsavta-db-server \
  --sku-name GP_Gen5_2
```

### 4. Feature Development Workflow

#### 4.1 Development Process
1. **Feature Planning**
   - Requirements gathering
   - Technical design review
   - Security impact assessment
   - Performance considerations

2. **Development**
   - Feature branch creation
   - Code development with tests
   - Security review
   - Performance testing

3. **Deployment**
   - Staging deployment and testing
   - User acceptance testing
   - Production deployment
   - Post-deployment monitoring

#### 4.2 Rollback Procedures
```bash
# Quick rollback using deployment slots
az webapp deployment slot swap \
  --resource-group helpsavta-prod-rg \
  --name helpsavta-app \
  --slot staging \
  --target-slot production \
  --action swap

# Database rollback (if needed)
# Restore from latest backup
az postgres server restore \
  --resource-group helpsavta-prod-rg \
  --name helpsavta-db-server-backup \
  --source-server helpsavta-db-server \
  --restore-point-in-time "2024-01-01T10:00:00Z"
```

---

## Final Notes

### Success Metrics
- **Uptime**: 99.9% availability
- **Performance**: < 2 second response times
- **Security**: Zero security incidents
- **User Satisfaction**: > 4.5/5 rating

### Support Contacts
- **Technical Lead**: admin@helpsavta.org
- **Azure Support**: Enterprise support plan
- **Emergency Contact**: +972-XX-XXX-XXXX

### Documentation Links
- [Azure App Service Documentation](https://docs.microsoft.com/en-us/azure/app-service/)
- [PostgreSQL on Azure Documentation](https://docs.microsoft.com/en-us/azure/postgresql/)
- [Application Insights Documentation](https://docs.microsoft.com/en-us/azure/azure-monitor/app/app-insights-overview)

This comprehensive guide provides everything needed to successfully deploy the HelpSavta platform to production on Azure. Follow each section methodically, and don't skip the security and monitoring steps - they are critical for a successful production deployment.