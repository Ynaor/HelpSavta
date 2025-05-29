# HelpSavta - Production Deployment Guide

This comprehensive guide covers the complete deployment process for the HelpSavta application, including CI/CD pipeline setup, Azure infrastructure configuration, and production best practices.

**Consolidated Guide**: This document combines information from multiple deployment guides to provide a single source of truth for production deployment.

## 🏗️ Infrastructure Overview

The HelpSavta application is deployed on Azure using a modern, scalable architecture with the following components:

### Core Services
- **Azure App Service** - Hosts the backend API with staging slots for blue-green deployments
- **Azure PostgreSQL Flexible Server** - Primary database with automated backups
- **Azure Cache for Redis** - Session management and caching
- **Azure Key Vault** - Secure secrets management
- **Azure Container Registry** - Docker image storage
- **Azure CDN** - Static asset delivery
- **Application Insights** - Monitoring and telemetry

### Supporting Services
- **Azure Storage Account** - File uploads and static assets
- **Azure Monitor** - Logging and alerting
- **GitHub Actions** - CI/CD pipeline automation

## 📁 File Structure

```
.github/workflows/
├── deploy.yml                    # Main CI/CD pipeline

azure/
├── main.bicep                    # Infrastructure as Code template
├── parameters.staging.json       # Staging environment parameters
└── parameters.production.json    # Production environment parameters

scripts/
├── deploy.sh                     # Main deployment script
├── setup-azure.sh               # Azure infrastructure setup
├── migrate-production.sh        # Production database migration
├── smoke-tests.sh               # Post-deployment verification
└── init-db.sql                  # Database initialization

docker/
├── Dockerfile                    # Backend container
├── frontend/Dockerfile           # Frontend container
├── frontend/nginx.conf          # Nginx configuration
├── docker-compose.yml           # Development environment
├── docker-compose.production.yml # Production environment
└── backend/scripts/docker-entrypoint.sh # Backend startup script

config/
└── .env.deployment.example       # Environment configuration template
```

## 🚀 Quick Start

### Prerequisites

1. **Azure CLI** installed and configured
2. **Docker** installed for local development
3. **Node.js 18+** for application development
4. **Azure subscription** with appropriate permissions

### Initial Setup

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd helpsavta
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.deployment.example .env.deployment
   # Edit .env.deployment with your Azure configuration
   ```

3. **Set up Azure infrastructure:**
   ```bash
   # Set your Azure subscription
   export AZURE_SUBSCRIPTION_ID="your-subscription-id"
   
   # Login to Azure
   az login
   
   # Create staging environment
   ./scripts/setup-azure.sh staging
   
   # Create production environment
   ./scripts/setup-azure.sh production
   ```

4. **Deploy the application:**
   ```bash
   # Deploy to staging
   ./scripts/deploy.sh staging
   
   # Deploy to production (after staging verification)
   ./scripts/deploy.sh production
   ```

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow

The CI/CD pipeline (`[.github/workflows/deploy.yml](.github/workflows/deploy.yml:1)`) includes:

#### 1. **Test Stage**
- Unit and integration tests
- Code quality checks (ESLint, Prettier)
- Security vulnerability scanning
- Database migration testing

#### 2. **Build Stage**
- Docker image creation
- Asset compilation and optimization
- Container registry upload

#### 3. **Deploy Stage**
- Infrastructure provisioning/updates
- Database migrations
- Blue-green deployment to staging slots
- Smoke tests and health checks
- Production swap (with approval)

### Pipeline Triggers

- **Push to `main`** → Production deployment
- **Push to `staging`** → Staging deployment
- **Pull requests** → Test suite execution

### Environment-Specific Deployments

#### Staging Environment
- Automatically deploys from `staging` branch
- Uses lower-cost resources (B1 App Service Plan)
- Serves as integration testing environment

#### Production Environment
- Deploys from `main` branch
- Requires manual approval for production swap
- Uses high-availability resources (P1v3 App Service Plan)
- Includes automatic rollback on failure

## 🏛️ Infrastructure Details

### Azure Resource Manager Template

The infrastructure is defined in [`azure/main.bicep`](azure/main.bicep:1) and includes:

#### Compute Resources
```bicep
// App Service Plan with Linux containers
resource appServicePlan 'Microsoft.Web/serverfarms@2022-09-01' = {
  name: appServicePlanName
  sku: {
    name: appServicePlanSku
    tier: 'PremiumV3'
  }
  kind: 'linux'
}

// Web App with staging slot
resource backendWebApp 'Microsoft.Web/sites@2022-09-01' = {
  name: '${appName}-backend'
  properties: {
    serverFarmId: appServicePlan.id
    siteConfig: {
      linuxFxVersion: 'DOCKER|${containerRegistry.properties.loginServer}/helpsavta-backend:latest'
    }
  }
}
```

#### Database Configuration
```bicep
// PostgreSQL Flexible Server
resource postgresServer 'Microsoft.DBforPostgreSQL/flexibleServers@2022-12-01' = {
  name: postgresServerName
  sku: {
    name: 'Standard_B1ms'
    tier: 'Burstable'
  }
  properties: {
    version: '15'
    backup: {
      backupRetentionDays: 7
    }
  }
}
```

#### Caching and Storage
```bicep
// Redis Cache
resource redisCache 'Microsoft.Cache/redis@2023-08-01' = {
  name: redisCacheName
  properties: {
    sku: redisCacheSku
    enableNonSslPort: false
    minimumTlsVersion: '1.2'
  }
}

// CDN for static assets
resource cdnProfile 'Microsoft.Cdn/profiles@2023-05-01' = {
  name: cdnProfileName
  sku: {
    name: 'Standard_Microsoft'
  }
}
```

### Environment Parameters

#### Staging ([`azure/parameters.staging.json`](azure/parameters.staging.json:1))
- **App Service Plan:** B1 (Basic)
- **Redis Cache:** Basic C0
- **PostgreSQL:** Burstable B1ms

#### Production ([`azure/parameters.production.json`](azure/parameters.production.json:1))
- **App Service Plan:** P1v3 (Premium)
- **Redis Cache:** Standard C1
- **PostgreSQL:** General Purpose with backup retention

## 🐳 Docker Configuration

### Backend Container ([`Dockerfile`](Dockerfile:1))

Multi-stage build optimized for production:

```dockerfile
# Dependencies stage
FROM node:18-alpine AS deps
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci --only=production

# Build stage
FROM node:18-alpine AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY backend/ .
RUN npx prisma generate && npm run build

# Production stage
FROM node:18-alpine AS runner
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
USER backend
EXPOSE 3001
```

### Frontend Container ([`frontend/Dockerfile`](frontend/Dockerfile:1))

Nginx-based static file serving:

```dockerfile
# Build stage
FROM node:18-alpine AS builder
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine AS runner
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
```

### Development Environment ([`docker-compose.yml`](docker-compose.yml:1))

Complete development stack:
- PostgreSQL with persistent data
- Redis for caching
- Backend with hot reload
- Frontend with development server
- pgAdmin and Redis Commander for management
- Mailhog for email testing

### Production Environment ([`docker-compose.production.yml`](docker-compose.production.yml:1))

Production-optimized configuration:
- Resource limits and reservations
- Health checks and restart policies
- Log aggregation with Fluentd
- Monitoring with Prometheus and Grafana
- SSL/TLS termination

## 🔧 Deployment Scripts

### Main Deployment ([`scripts/deploy.sh`](scripts/deploy.sh:1))

Comprehensive deployment automation:

```bash
# Usage: ./scripts/deploy.sh [environment] [--dry-run]
./scripts/deploy.sh staging
./scripts/deploy.sh production
./scripts/deploy.sh production --dry-run  # Preview changes
```

Features:
- Pre-deployment validation
- Docker image building and pushing
- Infrastructure deployment
- Database migrations
- Health checks and verification
- Automatic rollback on failure

### Infrastructure Setup ([`scripts/setup-azure.sh`](scripts/setup-azure.sh:1))

Initial Azure environment provisioning:

```bash
# Creates all Azure resources and configures secrets
./scripts/setup-azure.sh staging
./scripts/setup-azure.sh production
```

Includes:
- Resource group creation
- Key Vault setup with generated secrets
- Infrastructure deployment
- Monitoring alerts configuration
- Access policy setup

### Database Migration ([`scripts/migrate-production.sh`](scripts/migrate-production.sh:1))

Safe production database updates:

```bash
# Handles production database migrations with safety checks
./scripts/migrate-production.sh
```

Safety features:
- Automatic database backup
- Migration verification
- Rollback capability
- Confirmation prompts
- Health checks

### Smoke Tests ([`scripts/smoke-tests.sh`](scripts/smoke-tests.sh:1))

Post-deployment verification:

```bash
# Comprehensive application health verification
./scripts/smoke-tests.sh https://your-app-url.com
```

Tests include:
- HTTP endpoint availability
- API functionality
- Database connectivity
- Security headers
- Performance benchmarks

## 🔐 Security Configuration

### Secrets Management

All sensitive configuration is stored in Azure Key Vault:

- Database connection strings
- API keys and tokens
- SSL certificates
- Third-party service credentials

### Access Control

- **Service Principals** for automated deployments
- **Managed Identity** for Azure service authentication
- **RBAC** for resource access control
- **Key Vault Access Policies** for secret access

### Network Security

- **HTTPS enforcement** on all endpoints
- **Security headers** (HSTS, CSP, X-Frame-Options)
- **Rate limiting** and DDoS protection
- **Private endpoints** for database access

## 📊 Monitoring and Observability

### Application Insights

Comprehensive application monitoring:
- Request/response tracking
- Dependency monitoring
- Exception logging
- Custom metrics and events

### Health Checks

Multi-level health monitoring:
- Container health checks
- Application endpoints ([`/health`](backend/healthcheck.js:1))
- Database connectivity
- External service dependencies

### Alerting

Automated alerts for:
- High CPU/memory usage
- HTTP error rates
- Database connection issues
- Security incidents

## 🔄 Blue-Green Deployment

The deployment strategy uses Azure App Service staging slots:

1. **Deploy to staging slot** - New version deployed safely
2. **Run smoke tests** - Comprehensive verification
3. **Swap to production** - Zero-downtime cutover
4. **Monitor and verify** - Real-time health checks
5. **Rollback if needed** - Instant revert capability

## 🛠️ Local Development

### Quick Start

```bash
# Start all services
docker-compose up -d

# Start with additional tools
docker-compose --profile tools up -d

# View logs
docker-compose logs -f backend

# Run tests
docker-compose exec backend npm test
```

### Development URLs

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3001
- **pgAdmin:** http://localhost:5050
- **Redis Commander:** http://localhost:8081
- **Mailhog:** http://localhost:8025

### Environment Variables

Copy [`env.deployment.example`](.env.deployment.example:1) and customize:

```bash
cp .env.deployment.example .env.deployment
# Edit .env.deployment with your values
```

## 🚨 Troubleshooting

### Common Issues

1. **Deployment Fails**
   ```bash
   # Check Azure CLI login
   az account show
   
   # Verify resource group exists
   az group show --name helpsavta-production-rg
   
   # Check container registry access
   az acr login --name your-registry-name
   ```

2. **Database Connection Issues**
   ```bash
   # Test database connectivity
   ./scripts/smoke-tests.sh https://your-app.azurewebsites.net
   
   # Check Key Vault secrets
   az keyvault secret show --vault-name your-keyvault --name database-url
   ```

3. **Container Startup Problems**
   ```bash
   # Check container logs
   docker logs helpsavta-backend-prod
   
   # Verify environment variables
   docker exec helpsavta-backend-prod env | grep DATABASE_URL
   ```

### Rollback Procedures

1. **Application Rollback**
   ```bash
   # Swap back to previous version
   az webapp deployment slot swap \
     --resource-group helpsavta-production-rg \
     --name helpsavta-production-backend \
     --slot production \
     --target-slot staging
   ```

2. **Database Rollback**
   ```bash
   # Restore from backup (if needed)
   ./scripts/migrate-production.sh --restore backup-file.sql.gz
   ```

## 📈 Performance Optimization

### Infrastructure Scaling

- **Horizontal scaling** via App Service Plan scale-out
- **Vertical scaling** via SKU upgrades
- **Database scaling** via compute tier adjustment
- **CDN optimization** for global content delivery

### Application Optimization

- **Connection pooling** for database efficiency
- **Redis caching** for frequently accessed data
- **Image optimization** via CDN compression
- **Code splitting** for faster frontend loading

## 🔄 Maintenance

### Regular Tasks

1. **Weekly:**
   - Review monitoring dashboards
   - Check for security updates
   - Verify backup integrity

2. **Monthly:**
   - Update dependencies
   - Review resource utilization
   - Optimize query performance

3. **Quarterly:**
   - Security audit
   - Disaster recovery testing
   - Cost optimization review

### Backup Strategy

- **Database:** Automated daily backups with 7-day retention
- **Application:** Container images in registry
- **Configuration:** Infrastructure as Code in Git
- **Secrets:** Azure Key Vault with versioning

## 📚 Additional Resources

- [Azure App Service Documentation](https://docs.microsoft.com/en-us/azure/app-service/)
- [Azure PostgreSQL Documentation](https://docs.microsoft.com/en-us/azure/postgresql/)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

## 🚀 Step-by-Step Production Deployment

### Server Preparation

#### Create Application User
```bash
# Create dedicated user for the application
sudo useradd -m -s /bin/bash helpsavta
sudo usermod -aG sudo helpsavta

# Create application directory
sudo mkdir -p /opt/helpsavta
sudo chown -R helpsavta:helpsavta /opt/helpsavta
```

#### Install System Dependencies
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install Redis
sudo apt install -y redis-server

# Install Nginx
sudo apt install -y nginx

# Install additional tools
sudo apt install -y git curl wget unzip
```

### Database Setup

#### Configure PostgreSQL
```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE helpsavta_db;
CREATE USER helpsavta_user WITH PASSWORD 'your-secure-password';
GRANT ALL PRIVILEGES ON DATABASE helpsavta_db TO helpsavta_user;

# Grant schema permissions
\c helpsavta_db
GRANT ALL ON SCHEMA public TO helpsavta_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO helpsavta_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO helpsavta_user;

# Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

\q
```

#### Configure PostgreSQL Security
```bash
# Edit PostgreSQL configuration
sudo nano /etc/postgresql/14/main/postgresql.conf

# Add these settings:
listen_addresses = 'localhost'
max_connections = 100
shared_buffers = 256MB
effective_cache_size = 1GB
```

#### Configure Redis
```bash
# Edit Redis configuration
sudo nano /etc/redis/redis.conf

# Configure these settings:
bind 127.0.0.1
requirepass your-redis-password
maxmemory 256mb
maxmemory-policy allkeys-lru

# Restart Redis
sudo systemctl restart redis
sudo systemctl enable redis
```

### Application Deployment

#### Deploy Application Code
```bash
# Switch to application user
sudo su - helpsavta

# Clone repository
cd /opt/helpsavta
git clone https://github.com/your-repo/helpsavta.git .

# Navigate to backend
cd backend

# Install dependencies
npm install --production
```

#### Configure Environment
```bash
# Copy production environment template
cp .env.production.example .env.production

# Edit production environment
nano .env.production
```

**Production Environment Configuration:**
```env
NODE_ENV=production
PORT=3001
HOST=127.0.0.1

# Database
DATABASE_URL="postgresql://helpsavta_user:your-secure-password@localhost:5432/helpsavta_db"
DB_POOL_MIN=2
DB_POOL_MAX=20
DB_POOL_ACQUIRE_TIMEOUT=60000
DB_POOL_IDLE_TIMEOUT=10000

# Redis
REDIS_URL="redis://:your-redis-password@localhost:6379"

# Session (Generate a strong 32+ character secret)
SESSION_SECRET="your-super-secure-32-plus-character-session-secret"
SESSION_MAX_AGE=86400000

# Security
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS
FRONTEND_URL=https://yourdomain.com
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Admin (Change these immediately!)
DEFAULT_ADMIN_USERNAME=your-admin-username
DEFAULT_ADMIN_PASSWORD=your-secure-admin-password

# Email
EMAIL_HOST=smtp.your-provider.com
EMAIL_PORT=587
EMAIL_USER=your-email@yourdomain.com
EMAIL_PASS=your-app-password
EMAIL_FROM=noreply@yourdomain.com
EMAIL_SECURE=true

# Logging
LOG_LEVEL=info
```

### Post-Deployment Verification

#### Verification Checklist
- [ ] **Application Status**: `sudo systemctl status helpsavta-backend`
- [ ] **Database Connection**: `npm run db:monitor report`
- [ ] **Health Endpoint**: `curl https://yourdomain.com/health`
- [ ] **API Endpoints**: Test all critical API endpoints
- [ ] **SSL Certificate**: Verify SSL is working correctly
- [ ] **Backup System**: Test backup creation and restoration
- [ ] **Log Rotation**: Verify logs are being rotated
- [ ] **Monitoring**: Check all monitoring systems

### Troubleshooting

#### Common Issues

**Database Connection Failed**
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check connection
sudo -u postgres psql -c "SELECT version();"

# Verify database exists
sudo -u postgres psql -l | grep helpsavta_db
```

**Application Won't Start**
```bash
# Check application logs
sudo journalctl -u helpsavta-backend -f

# Check environment configuration
cd /opt/helpsavta/backend
npm run production:setup check
```

**SSL Certificate Issues**
```bash
# Check certificate status
sudo certbot certificates

# Renew certificates
sudo certbot renew --force-renewal
```

### Maintenance Procedures

#### Daily Maintenance
- [ ] Check application health: `npm run db:monitor report`
- [ ] Review application logs: `sudo journalctl -u helpsavta-backend --since today`
- [ ] Monitor disk space: `df -h`

#### Weekly Maintenance
- [ ] Review backup integrity
- [ ] Check SSL certificate expiration
- [ ] Update system packages: `sudo apt update && sudo apt upgrade`
- [ ] Review performance metrics

#### Monthly Maintenance
- [ ] Database maintenance: Run VACUUM and ANALYZE
- [ ] Log cleanup: Review and clean old logs
- [ ] Security updates: Apply all security patches
- [ ] Performance review: Analyze slow queries and optimize

## 🤝 Contributing

When contributing to the infrastructure:

1. Test changes in staging environment first
2. Update documentation for any configuration changes
3. Follow the established naming conventions
4. Ensure all secrets are properly managed in Key Vault
5. Add appropriate monitoring and alerting for new components

---

For questions or issues with the deployment pipeline, please contact the development team or create an issue in the repository.