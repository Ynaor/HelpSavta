# Database Configuration Guide

This guide explains the database configuration setup for the HelpSavta project, which supports both SQLite (for simple local development) and PostgreSQL (for Docker development and production).

## Overview

The project has been configured to support two database scenarios:

1. **SQLite Development** - Simple local development without Docker
2. **PostgreSQL Development** - Docker-based development and production

## Configuration Files

### Schema Management

The project uses separate Prisma schema files for each database type:

- `prisma/schema.prisma` - Active schema (automatically managed)
- `prisma/schema.postgresql.prisma` - PostgreSQL template
- Helper scripts automatically switch between providers

### Local Development with SQLite

**File**: `backend/.env`
```env
DATABASE_URL="file:./dev.db"
```

**Advantages**:
- No Docker required
- Instant setup
- File-based database
- Great for quick development and testing

**Usage**:
```bash
cd backend
npm run db:setup-sqlite  # Switches to SQLite and sets up database
npm run dev
```

### Docker Development with PostgreSQL

**File**: `docker-compose.yml` (automatically configured)
```env
DATABASE_URL=postgresql://helpsavta:helpsavta_dev_password@postgres:5432/helpsavta
```

**Advantages**:
- Production-like environment
- Better for team development
- Includes Redis, pgAdmin, and other services
- Matches production database type

**Usage**:
```bash
# Start all services
docker-compose up -d

# Switch to PostgreSQL and set up database
cd backend
npm run db:setup-postgresql
```

## Database Management Commands

### Quick Setup Commands
```bash
# Set up SQLite (recommended for local development)
npm run db:setup-sqlite

# Set up PostgreSQL (for Docker development)
npm run db:setup-postgresql
```

### Manual Database Commands
```bash
# Switch database provider only
npm run db:use-sqlite
npm run db:use-postgresql

# Standard Prisma commands
npm run db:generate    # Generate Prisma client
npm run db:push       # Push schema to database
npm run db:studio     # Open Prisma Studio
npm run db:seed       # Seed database with initial data

# Migration commands (PostgreSQL only)
npm run db:migrate           # Create and apply migration
npm run db:migrate:deploy    # Deploy migrations (production)
npm run db:migrate:reset     # Reset database (development)
```

## Switching Between Configurations

### From SQLite to PostgreSQL
```bash
# Make sure PostgreSQL is running
docker-compose up -d postgres

# Switch to PostgreSQL and set up
npm run db:setup-postgresql
```

### From PostgreSQL to SQLite
```bash
# Switch to SQLite and set up
npm run db:setup-sqlite
```

## Production Configuration

Production uses PostgreSQL with additional configuration:

```env
DATABASE_URL="postgresql://username:password@host:port/database"
DB_POOL_MIN=2
DB_POOL_MAX=20
DB_POOL_ACQUIRE_TIMEOUT=60000
DB_POOL_IDLE_TIMEOUT=10000
```

Production automatically uses the PostgreSQL schema.

## Troubleshooting

### Common Issues

1. **Prisma Client Generation Error**
   ```bash
   npm run db:generate
   ```

2. **Database Connection Error**
   - Check `DATABASE_URL` in `.env`
   - For PostgreSQL, ensure Docker container is running: `docker-compose up -d postgres`
   - For SQLite, ensure file permissions are correct

3. **Schema Out of Sync**
   ```bash
   npm run db:push
   ```

4. **Reset Database (Development Only)**
   ```bash
   # SQLite - delete the file and recreate
   rm backend/dev.db
   npm run db:setup-sqlite

   # PostgreSQL - reset migrations
   npm run db:migrate:reset
   ```

5. **Wrong Database Provider**
   ```bash
   # Switch to correct provider
   npm run db:setup-sqlite     # For local development
   npm run db:setup-postgresql # For Docker development
   ```

### Environment File Issues

If you get environment validation errors:
1. Ensure `backend/.env` exists (created from `backend/.env.example`)
2. Check that all required variables are set
3. Verify `DATABASE_URL` format matches your chosen database

## Quick Start Commands

### For SQLite Development (Fastest)
```bash
cd backend
npm install
npm run db:setup-sqlite  # Switches to SQLite and sets up database
npm run dev
```

### For Docker Development (Production-like)
```bash
docker-compose up -d postgres redis
cd backend
npm install
npm run db:setup-postgresql  # Switches to PostgreSQL and sets up database
npm run dev
```

## File Structure

```
backend/
├── .env                          # Local development configuration
├── .env.example                  # Template for environment variables
├── prisma/
│   ├── schema.prisma            # Active schema (auto-managed)
│   └── schema.postgresql.prisma # PostgreSQL schema template
├── scripts/
│   ├── use-sqlite.js            # Switch to SQLite schema
│   └── use-postgresql.js        # Switch to PostgreSQL schema
└── src/
    └── config/
        └── environment.ts        # Environment validation and configuration
```

The helper scripts automatically manage schema switching between SQLite and PostgreSQL providers.