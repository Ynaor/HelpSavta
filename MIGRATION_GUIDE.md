# Database Migration Guide - SQLite to PostgreSQL

This comprehensive guide covers the complete database migration implementation from SQLite to PostgreSQL for the HelpSavta application, including all completed components and migration procedures.

**Consolidated Guide**: This document combines migration instructions with implementation status to provide complete migration guidance.

## 🎯 Migration Status: COMPLETED ✅

The following components have been successfully implemented and are ready for production migration:

### ✅ Completed Implementation Components

#### 1. Prisma Schema Updated
- **File**: [`backend/prisma/schema.prisma`](backend/prisma/schema.prisma:1)
- **Changes**: Updated datasource provider from `sqlite` to `postgresql`
- **Status**: PostgreSQL compatible models with proper data types and indexes

#### 2. PostgreSQL Dependencies Added
- **File**: [`backend/package.json`](backend/package.json:1)
- **Added**:
  - `pg`: PostgreSQL driver
  - `@types/pg`: TypeScript definitions
- **Scripts**: Production-ready Prisma commands configured

#### 3. Production Database Configuration
- **File**: [`backend/src/config/database.production.ts`](backend/src/config/database.production.ts:1)
- **Features**:
  - Connection pooling configuration
  - SSL support for production
  - Database health checks
  - Performance optimization with indexes
  - Backup configuration helpers

#### 4. Environment Configuration System
- **File**: [`backend/src/config/environment.ts`](backend/src/config/environment.ts:1)
- **Features**:
  - Comprehensive environment validation using Joi
  - Support for development, staging, and production
  - Database, Redis, email, SMS, and security configurations
  - Type-safe environment variables

#### 5. Migration Script
- **File**: [`backend/scripts/migrate-to-postgresql.ts`](backend/scripts/migrate-to-postgresql.ts:1)
- **Features**:
  - Automated SQLite to PostgreSQL data migration
  - Data backup before migration
  - Integrity verification
  - Error handling and reporting
  - Database optimization (indexes)

#### 6. Backup & Restore System
- **File**: [`backend/scripts/backup-restore.ts`](backend/scripts/backup-restore.ts:1)
- **Features**:
  - PostgreSQL backup creation (pg_dump)
  - Compressed backup support
  - Restore from backup files
  - Backup management (list, clean old backups)
  - CLI interface

#### 7. Environment Templates
- **Files**:
  - [`backend/.env.example`](backend/.env.example:1) - Updated with PostgreSQL configs
  - [`backend/.env.production.example`](backend/.env.production.example:1) - Production template
- **Features**:
  - Complete environment variable documentation
  - Cloud provider examples (AWS, GCP, Azure, Heroku)
  - Security best practices

#### 8. Updated Server Configuration
- **File**: [`backend/src/server.ts`](backend/src/server.ts:1)
- **Changes**:
  - Uses new environment configuration system
  - Dynamic Prisma client initialization
  - Enhanced health checks with database connectivity
  - Production-ready session and security settings

## Prerequisites

Before starting the migration, ensure you have:

1. **PostgreSQL installed and running**
   - PostgreSQL 12+ recommended
   - Access to create databases and users
   - Connection details (host, port, username, password, database name)

2. **Node.js dependencies updated**
   ```bash
   npm install
   ```

3. **Environment variables configured**
   - See [Environment Configuration](#environment-configuration) section

## Migration Steps

### 1. Environment Configuration

#### Development Environment (.env)
Keep your current SQLite configuration for development:
```env
NODE_ENV=development
DATABASE_URL="file:./dev.db"
```

#### Production Environment (.env.production)
Create a new `.env.production` file with PostgreSQL configuration:
```env
NODE_ENV=production
DATABASE_URL="postgresql://username:password@localhost:5432/helpsavta_db"

# Database Pool Configuration
DB_POOL_MIN=2
DB_POOL_MAX=20
DB_POOL_ACQUIRE_TIMEOUT=60000
DB_POOL_IDLE_TIMEOUT=10000

# Redis for session store (recommended for production)
REDIS_URL="redis://localhost:6379"

# Session Configuration
SESSION_SECRET=your-super-secret-session-key-min-32-chars
SESSION_MAX_AGE=86400000

# Security Configuration
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS Configuration
FRONTEND_URL=https://yourdomain.com
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Admin Configuration
DEFAULT_ADMIN_USERNAME=your-admin-username
DEFAULT_ADMIN_PASSWORD=your-secure-admin-password

# Email Configuration
EMAIL_HOST=smtp.your-email-provider.com
EMAIL_PORT=587
EMAIL_USER=your-email@example.com
EMAIL_PASS=your-app-specific-password
EMAIL_FROM=noreply@your-domain.com
EMAIL_SECURE=true

# Logging
LOG_LEVEL=info
```

### 2. Database Setup

#### Create PostgreSQL Database
```sql
-- Connect to PostgreSQL as superuser
CREATE DATABASE helpsavta_db;
CREATE USER helpsavta_user WITH PASSWORD 'your-secure-password';
GRANT ALL PRIVILEGES ON DATABASE helpsavta_db TO helpsavta_user;

-- Grant schema permissions
\c helpsavta_db
GRANT ALL ON SCHEMA public TO helpsavta_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO helpsavta_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO helpsavta_user;
```

### 3. Schema Migration

#### Generate Prisma Client for PostgreSQL
```bash
# Set environment to use PostgreSQL
export NODE_ENV=production
# or copy .env.production to .env temporarily

# Generate Prisma client
npm run db:generate

# Push schema to PostgreSQL (creates tables)
npm run db:push
```

#### Alternative: Use Prisma Migrate
```bash
# Create initial migration
npx prisma migrate dev --name init

# For production deployment
npm run db:migrate:deploy
```

### 4. Data Migration

#### Option A: Automated Migration Script
Run the comprehensive migration script that handles backup, migration, and verification:

```bash
npm run migrate:postgresql
```

This script will:
- Create a backup of your SQLite data
- Migrate all data to PostgreSQL
- Verify data integrity
- Optimize the PostgreSQL database with indexes

#### Option B: Manual Migration Steps

1. **Backup SQLite Data**
   ```bash
   # The migration script creates JSON backups automatically
   # Manual backup location: backend/backups/
   ```

2. **Run Migration**
   ```bash
   npm run migrate:postgresql
   ```

3. **Verify Migration**
   Check the migration output for:
   - Record counts match between SQLite and PostgreSQL
   - No errors reported
   - All tables populated correctly

### 5. Database Optimization

The migration script automatically creates indexes for optimal performance:

```sql
-- These indexes are created automatically during migration
CREATE INDEX CONCURRENTLY idx_tech_requests_status ON tech_requests(status);
CREATE INDEX CONCURRENTLY idx_tech_requests_created_at ON tech_requests(created_at);
CREATE INDEX CONCURRENTLY idx_tech_requests_assigned_admin ON tech_requests(assigned_admin_id);
CREATE INDEX CONCURRENTLY idx_available_slots_date ON available_slots(date);
CREATE INDEX CONCURRENTLY idx_available_slots_is_booked ON available_slots(is_booked);
CREATE INDEX CONCURRENTLY idx_admin_users_username ON admin_users(username);
CREATE INDEX CONCURRENTLY idx_admin_users_is_active ON admin_users(is_active);
CREATE INDEX CONCURRENTLY idx_notification_logs_sent_at ON notification_logs(sent_at);
```

## Backup and Restore

### Creating Backups

#### Full Backup
```bash
npm run backup-restore backup
```

#### Schema Only
```bash
npm run backup-restore backup -- --schema-only
```

#### Data Only
```bash
npm run backup-restore backup -- --data-only
```

### Restoring from Backup

```bash
npm run backup-restore restore /path/to/backup/file.sql.gz
```

### Managing Backups

#### List Available Backups
```bash
npm run backup-restore list
```

#### Clean Old Backups (keep last 5)
```bash
npm run backup-restore clean
```

#### Clean Old Backups (keep last 10)
```bash
npm run backup-restore clean 10
```

## Production Deployment

### 1. Environment Variables

Set these environment variables in your production environment:

```bash
NODE_ENV=production
DATABASE_URL="postgresql://username:password@host:port/database"
REDIS_URL="redis://host:port"
SESSION_SECRET="your-32+-char-secret"
# ... other production variables
```

### 2. Database Migration in Production

```bash
# Install dependencies
npm install

# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate:deploy

# Optional: Seed initial data
npm run db:seed
```

### 3. Application Startup

```bash
# Build the application
npm run build

# Start the production server
npm start
```

## Monitoring and Maintenance

### Health Checks

The application includes database health checks accessible at:
```
GET /health
```

### Connection Pooling

PostgreSQL connection pooling is configured automatically:
- **Minimum connections**: 2
- **Maximum connections**: 20
- **Acquire timeout**: 60 seconds
- **Idle timeout**: 10 seconds

### Performance Monitoring

Monitor these PostgreSQL metrics:
- Connection count
- Query execution time
- Index usage
- Lock waits
- Cache hit ratios

## Troubleshooting

### Common Issues

#### Connection Refused
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```
**Solution**: Ensure PostgreSQL is running and accessible

#### Authentication Failed
```
Error: password authentication failed for user "username"
```
**Solution**: Verify username/password and database permissions

#### Migration Fails
```
Error: relation "table_name" already exists
```
**Solution**: 
1. Drop existing tables: `npm run db:migrate:reset`
2. Re-run migration: `npm run migrate:postgresql`

#### Data Integrity Issues
**Solution**: 
1. Check migration logs for specific errors
2. Verify foreign key relationships
3. Re-run migration with backup restore if needed

### Database Administration

#### Connect to PostgreSQL
```bash
psql -h localhost -p 5432 -U helpsavta_user -d helpsavta_db
```

#### Check Database Size
```sql
SELECT pg_size_pretty(pg_database_size('helpsavta_db'));
```

#### Monitor Active Connections
```sql
SELECT count(*) FROM pg_stat_activity WHERE datname = 'helpsavta_db';
```

#### View Table Sizes
```sql
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## Security Considerations

1. **Database Credentials**: Use strong passwords and rotate regularly
2. **Connection Security**: Use SSL/TLS connections in production
3. **Network Security**: Restrict database access to application servers only
4. **Backup Security**: Encrypt backup files and store securely
5. **User Permissions**: Follow principle of least privilege

## 🚀 Available Commands

### Database Migration
```bash
# Run complete SQLite to PostgreSQL migration
npm run migrate:postgresql

# Generate Prisma client for PostgreSQL
npm run db:generate

# Deploy migrations to production
npm run db:migrate:deploy

# Reset database (development only)
npm run db:migrate:reset
```

### Backup & Restore
```bash
# Create database backup
npm run backup-restore backup

# Create schema-only backup
npm run backup-restore backup -- --schema-only

# Create data-only backup
npm run backup-restore backup -- --data-only

# Restore from backup
npm run backup-restore restore /path/to/backup.sql.gz

# List available backups
npm run backup-restore list

# Clean old backups (keep 5 most recent)
npm run backup-restore clean
```

### Database Management
```bash
# Open Prisma Studio
npm run db:studio

# Push schema changes (development)
npm run db:push

# Seed database
npm run db:seed
```

## 📊 Database Schema

The following models are migrated:

1. **TechRequest** - Technical assistance requests
2. **AvailableSlot** - Available time slots for volunteers
3. **AdminUser** - System administrators and volunteers
4. **NotificationLog** - Log of sent notifications

### Performance Indexes Created

The migration automatically creates these indexes for optimal performance:

- `idx_tech_requests_status` - For filtering by request status
- `idx_tech_requests_created_at` - For chronological ordering
- `idx_tech_requests_assigned_admin` - For admin workload queries
- `idx_available_slots_date` - For calendar date lookups
- `idx_available_slots_is_booked` - For availability checks
- `idx_admin_users_username` - For authentication
- `idx_admin_users_is_active` - For active user queries
- `idx_notification_logs_sent_at` - For notification history

## 🔒 Security Features

### Database Security
- **Connection pooling** with configurable limits
- **SSL/TLS support** for production connections
- **Environment-based configuration** with validation
- **Prepared statements** (Prisma default)

### Application Security
- **Session management** with Redis in production
- **Rate limiting** with configurable thresholds
- **CORS protection** with environment-specific origins
- **Helmet security headers**
- **Input validation** with Joi schemas

## 📋 Migration Checklist

Before going to production, ensure you have:

- [ ] **PostgreSQL installed and configured**
- [ ] **Environment variables set** (copy `.env.production.example` to `.env.production`)
- [ ] **Database created** with proper user permissions
- [ ] **SSL configured** for production database connections
- [ ] **Redis configured** for session storage (recommended)
- [ ] **Backup strategy** implemented
- [ ] **Migration tested** in staging environment
- [ ] **Performance indexes** created (automatic during migration)
- [ ] **Security settings** reviewed and updated

## 📝 Next Steps

After completing the migration:

1. **Test thoroughly** in staging environment
2. **Monitor performance** and optimize if needed
3. **Set up regular backups** automated schedule
4. **Configure monitoring** and alerting
5. **Update deployment scripts** for production
6. **Train team** on new backup/restore procedures

## Support

For additional help:
1. Check application logs for detailed error messages
2. Review Prisma documentation: https://www.prisma.io/docs/
3. PostgreSQL documentation: https://www.postgresql.org/docs/
4. Create backup before any major changes

## 📚 Additional Resources

- [Prisma PostgreSQL Guide](https://www.prisma.io/docs/concepts/database-connectors/postgresql)
- [PostgreSQL Performance Tuning](https://www.postgresql.org/docs/current/performance-tips.html)
- [Database Security Best Practices](https://www.postgresql.org/docs/current/security.html)

---

**Migration Status**: ✅ **COMPLETED**
**Date**: Implementation completed
**Version**: 1.0.0
**Environment Ready**: Development ✅ | Staging ⏳ | Production ⏳

**Last Updated**: Migration implementation date
**Version**: 1.0.0