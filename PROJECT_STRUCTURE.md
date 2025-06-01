# HelpSavta Project Structure

## Overview

This document describes the optimized project structure for HelpSavta, a technical help volunteer platform. The project has been reorganized to improve maintainability, developer experience, and CI/CD efficiency.

## Project Structure

```
HelpSavta/
├── .gitignore                 # Consolidated gitignore for entire project
├── package.json               # Root package.json with workspace configuration
├── package-lock.json          # Root lock file
├── README.md                  # Main project documentation
├── PROJECT_STRUCTURE.md       # This file
├── start.sh                   # Quick start script
│
├── backend/                   # Backend application
│   ├── package.json           # Backend-specific dependencies
│   ├── tsconfig.json          # TypeScript configuration
│   ├── jest.config.js         # Jest configuration (updated paths)
│   ├── healthcheck.js         # Health check endpoint
│   ├── src/                   # Source code
│   └── prisma/                # Database schema and migrations
│
├── frontend/                  # Frontend application
│   ├── package.json           # Frontend-specific dependencies
│   ├── tsconfig.json          # TypeScript configuration
│   ├── vite.config.ts         # Vite configuration
│   ├── vitest.config.ts       # Vitest configuration (updated paths)
│   ├── tailwind.config.js     # Tailwind CSS configuration
│   ├── postcss.config.js      # PostCSS configuration
│   ├── index.html             # HTML entry point
│   └── src/                   # Source code
│
├── tools/                     # Development and deployment tools
│   ├── package.json           # Tools workspace package.json
│   ├── email/                 # Email testing tools
│   │   └── test-sendgrid-integration.js
│   ├── database/              # Database management tools
│   │   ├── backup-restore.ts
│   │   ├── db-monitor.ts
│   │   ├── migrate-to-postgresql.ts
│   │   ├── use-sqlite.js
│   │   ├── use-postgresql.js
│   │   ├── init-db.sql
│   │   └── init-db-minimal.sql
│   ├── deployment/            # Deployment scripts
│   │   └── setup-project.sh
│   └── development/           # Development utilities
│       └── smoke-tests.sh
│
└── tests/                     # Unified test suite
    ├── package.json           # Tests workspace package.json
    ├── playwright.config.ts   # Playwright E2E configuration
    ├── backend/               # Backend tests
    │   ├── globalSetup.ts
    │   ├── globalTeardown.ts
    │   ├── setup.ts
    │   ├── health.test.ts
    │   └── test-*.ts          # Integration tests
    ├── frontend/              # Frontend tests
    │   ├── setup.ts
    │   └── App.test.tsx
    ├── e2e/                   # End-to-end tests
    │   └── example.spec.ts
    └── shared/                # Shared test utilities
```

## Key Improvements

### 1. Configuration Consolidation

#### Before:
- Multiple .gitignore files (root, backend, frontend)
- Duplicate axios dependency
- Inconsistent versioning

#### After:
- Single consolidated .gitignore at root level
- No duplicate dependencies
- Consistent versioning across all packages
- Proper workspace configuration

### 2. Test Organization

#### Before:
```
backend/src/__tests__/         # Backend tests scattered
frontend/src/test/             # Frontend tests in different location
```

#### After:
```
tests/
├── backend/                   # All backend tests
├── frontend/                  # All frontend tests
├── e2e/                       # End-to-end tests
└── shared/                    # Shared test utilities
```

### 3. Script Consolidation

#### Before:
```
scripts/                       # Project-level scripts
backend/scripts/               # Backend-specific scripts
```

#### After:
```
tools/
├── email/                     # Email testing tools
├── database/                  # Database management
├── deployment/                # Deployment scripts
└── development/               # Development utilities
```

## Workspace Commands

### Root Level Commands

```bash
# Development
npm run dev                    # Start both backend and frontend
npm run dev:backend           # Start backend only
npm run dev:frontend          # Start frontend only

# Building
npm run build                 # Build all workspaces
npm run build:backend         # Build backend only
npm run build:frontend        # Build frontend only

# Testing
npm run test                  # Run all tests
npm run test:backend          # Run backend tests
npm run test:frontend         # Run frontend tests
npm run test:e2e              # Run E2E tests

# Linting
npm run lint                  # Lint all workspaces
npm run lint:fix              # Fix linting issues

# Utilities
npm run clean                 # Clean all workspaces
npm run typecheck             # Type check all workspaces
npm run tools:email-test      # Run email testing tool
npm run tools:db-monitor      # Run database monitoring
```

### Database Commands

```bash
npm run db:setup              # Setup database
npm run db:reset              # Reset database
npm run db:seed               # Seed database
```

### Tools Commands

```bash
# Email testing
npm run tools:email-test your-email@example.com

# Database management
npm run tools:db-monitor
npm run backup:db
```

## Configuration Files

### Root Configuration
- `.gitignore` - Comprehensive ignore rules for entire project
- `package.json` - Workspace configuration and shared scripts

### Backend Configuration
- `jest.config.js` - Updated to use unified test directory
- `tsconfig.json` - TypeScript configuration
- `prisma/schema.prisma` - Database schema

### Frontend Configuration
- `vitest.config.ts` - Updated to use unified test directory
- `vite.config.ts` - Vite bundler configuration
- `tailwind.config.js` - Tailwind CSS configuration

### Test Configuration
- `tests/playwright.config.ts` - E2E test configuration
- Test setup files moved to respective test directories

## Benefits

1. **Reduced Maintenance Overhead**
   - Single source of truth for configurations
   - Eliminated duplicate files and dependencies
   - Consistent versioning across workspaces

2. **Improved Developer Experience**
   - Clear, logical organization
   - Unified test structure
   - Consistent command patterns

3. **Enhanced CI/CD**
   - Streamlined build processes
   - Centralized test execution
   - Better caching strategies

4. **Better Scalability**
   - Proper monorepo structure
   - Separated concerns (tools, tests, apps)
   - Room for future growth

## Migration Notes

### Removed Files
- `backend/.gitignore` (consolidated into root)
- `frontend/.gitignore` (consolidated into root)
- `scripts/` directory (moved to `tools/`)
- `backend/scripts/` directory (moved to `tools/database/`)

### Moved Files
- All test files moved to `tests/` directory
- Scripts reorganized by function in `tools/`
- Email testing consolidated

### Updated References
- Jest configuration updated for new test paths
- Vitest configuration updated for new test paths
- Package.json scripts updated to use workspace commands

## Getting Started

1. **Install dependencies:**
   ```bash
   npm run install:all
   ```

2. **Setup database:**
   ```bash
   npm run db:setup
   ```

3. **Start development:**
   ```bash
   npm run dev
   ```

4. **Run tests:**
   ```bash
   npm run test
   ```

This structure provides a solid foundation for the HelpSavta project with improved organization, maintainability, and developer experience.