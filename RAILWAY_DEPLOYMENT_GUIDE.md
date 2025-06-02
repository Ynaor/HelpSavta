# 🚀 Railway Deployment Guide for HelpSavta

A comprehensive guide for deploying the HelpSavta mono-repo application to Railway using Docker containers.

## 📋 Table of Contents

1. [🚀 Quick Start (TL;DR)](#-quick-start-tldr)
2. [📋 Prerequisites](#-prerequisites)
3. [🏗️ Railway Project Setup](#️-railway-project-setup)
4. [🗄️ PostgreSQL Database Setup](#️-postgresql-database-setup)
5. [⚙️ Backend Service Configuration](#️-backend-service-configuration)
6. [🌐 Frontend Service Configuration](#-frontend-service-configuration)
7. [🔐 Environment Variables Reference](#-environment-variables-reference)
8. [🚀 Deployment Process](#-deployment-process)
9. [✅ Post-Deployment Steps](#-post-deployment-steps)
10. [🔧 Advanced Configuration](#-advanced-configuration)
11. [📊 Monitoring & Troubleshooting](#-monitoring--troubleshooting)

---

## 🚀 Quick Start (TL;DR)

**Expected Timeline:** 30-45 minutes  
**Estimated Cost:** $5-15/month  
**Services:** Backend + Frontend + PostgreSQL (+ optional Redis)

### Quick Deploy Checklist

- [ ] Railway account with GitHub connected
- [ ] Fork/clone HelpSavta repository
- [ ] Create Railway project with 3 services
- [ ] Deploy PostgreSQL database
- [ ] Configure backend service with environment variables
- [ ] Deploy frontend service
- [ ] Run database migrations
- [ ] Set up admin user
- [ ] Test application

---

## 📋 Prerequisites

### Required Accounts & Tools
- **Railway Account**: [Sign up at railway.app](https://railway.app)
- **GitHub Account**: Connected to Railway
- **Domain** (Optional): For custom domain setup
- **SendGrid Account** (Recommended): For email notifications

### Repository Access
- Ensure your HelpSavta repository is accessible on GitHub
- The repository must contain the Docker files and configuration

### Cost Considerations
- **PostgreSQL**: ~$5/month for 1GB database
- **Backend Service**: ~$5-10/month depending on usage
- **Frontend Service**: ~$2-5/month for static hosting
- **Redis** (Optional): ~$3/month for session management

---

## 🏗️ Railway Project Setup

### 1. Create New Railway Project

1. Visit [Railway Dashboard](https://railway.app/dashboard)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your HelpSavta repository

### 2. Configure Multi-Service Architecture

Railway will detect your mono-repo structure. You'll need to create **3 services**:

```mermaid
graph LR
    A[GitHub Repo] --> B[Railway Project]
    B --> C[Backend Service]
    B --> D[Frontend Service]
    B --> E[PostgreSQL Database]
    B --> F[Redis Service<br/>Optional]
    
    C --> G[Port 3001<br/>API Server]
    D --> H[Port 80<br/>nginx + React]
    E --> I[PostgreSQL<br/>Database]
```

### 3. Service Configuration Overview

| Service | Technology | Port | Purpose |
|---------|------------|------|---------|
| Backend | Node.js 18 + Express | 3001 | API Server |
| Frontend | React + nginx | 80 | Web Interface |
| Database | PostgreSQL | 5432 | Data Storage |
| Redis (Optional) | Redis | 6379 | Session Store |

---

## 🗄️ PostgreSQL Database Setup

### 1. Add PostgreSQL Database

1. In your Railway project dashboard
2. Click **"+ New Service"**
3. Select **"Database"**
4. Choose **"PostgreSQL"**
5. Railway will provision the database automatically

### 2. Get Database Connection String

1. Click on your PostgreSQL service
2. Go to **"Variables"** tab
3. Copy the `DATABASE_URL` value
4. Format: `postgresql://username:password@host:port/database`

### 3. Database Configuration

The database will be automatically configured with:
- **Host**: Internal Railway hostname
- **Port**: 5432
- **SSL**: Enabled by default
- **Connection Pooling**: Managed by Railway

### 4. Database Access

- **Internal Access**: Automatic via `DATABASE_URL`
- **External Access**: Available via Railway's proxy
- **Management**: Use Railway's built-in database browser or external tools

---

## ⚙️ Backend Service Configuration

### 1. Create Backend Service

1. Click **"+ New Service"** in your project
2. Select **"GitHub Repo"**
3. Choose your repository
4. Set **Root Directory**: `/backend`
5. Railway will detect the `Dockerfile`

### 2. Docker Configuration

The backend uses a multi-stage Docker build:

```dockerfile
# Uses Node.js 18 Alpine for optimal size
FROM node:18-alpine AS production
# Includes security hardening with non-root user
# Health check on /health endpoint
# Runs on port 3001
```

### 3. Required Environment Variables

Configure these in the Railway service **Variables** section:

#### Core Configuration
```bash
NODE_ENV=production
PORT=3001
HOST=0.0.0.0
```

#### Database Configuration
```bash
DATABASE_URL=${{Postgres.DATABASE_URL}}  # Auto-filled by Railway
DB_POOL_MIN=2
DB_POOL_MAX=20
DB_POOL_ACQUIRE_TIMEOUT=60000
DB_POOL_IDLE_TIMEOUT=10000
```

#### Session Management
```bash
SESSION_SECRET=your-very-long-random-secret-key-32-plus-characters
SESSION_MAX_AGE=86400000
```

#### Security Configuration
```bash
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

#### CORS Configuration
```bash
FRONTEND_URL=https://your-frontend-domain.railway.app
ALLOWED_ORIGINS=https://your-frontend-domain.railway.app
```

#### Admin Configuration
```bash
DEFAULT_ADMIN_USERNAME=admin
DEFAULT_ADMIN_PASSWORD=change-this-secure-password
```

#### Email Configuration (SendGrid - Recommended)
```bash
SENDGRID_API_KEY=SG.your-sendgrid-api-key-here
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=Help Savta
EMAIL_REPLY_TO=support@yourdomain.com
SUPPORT_EMAIL=support@yourdomain.com
```

#### SMTP Fallback (Optional)
```bash
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_SECURE=true
```

#### Logging
```bash
LOG_LEVEL=info
HEALTH_CHECK_PATH=/health
```

### 4. Health Check Configuration

The backend includes automatic health checks:
- **Endpoint**: `/health`
- **Interval**: 30 seconds
- **Timeout**: 3 seconds
- **Retries**: 3

### 5. Database Migration Setup

The Dockerfile automatically runs:
```bash
npx prisma generate  # Generate Prisma client
npx prisma migrate deploy  # Apply migrations
```

---

## 🌐 Frontend Service Configuration

### 1. Create Frontend Service

1. Click **"+ New Service"**
2. Select **"GitHub Repo"**
3. Choose your repository
4. Set **Root Directory**: `/frontend`
5. Railway will detect the `Dockerfile`

### 2. Docker Configuration

The frontend uses nginx for production serving:

```dockerfile
# Multi-stage build: React build + nginx
# Optimized static asset serving
# Health check on /health endpoint
# Runs on port 80
```

### 3. Frontend Environment Variables

Configure in Railway Variables:

```bash
# API Configuration - Point to your backend service
VITE_API_URL=https://your-backend-service.railway.app/api

# Production optimization
NODE_ENV=production
```

### 4. nginx Configuration

The frontend Dockerfile includes optimized nginx configuration:

- **SPA Routing**: All routes serve `index.html`
- **Static Asset Caching**: 1-year cache for JS/CSS/images
- **Security Headers**: XSS protection, content type options
- **Gzip Compression**: Enabled for optimal performance
- **Health Check**: `/health` endpoint returns "healthy"

### 5. API Proxy Configuration

The frontend service communicates with the backend via Railway's internal networking:

```typescript
// src/services/api.ts
const api = axios.create({
  baseURL: '/api',  // Will proxy to backend
  withCredentials: true,
});
```

### 6. Custom Domain Setup

1. Go to your frontend service settings
2. Click **"Domains"**
3. Add your custom domain
4. Update DNS with Railway's provided values
5. SSL certificates are auto-provisioned

---

## 🔐 Environment Variables Reference

### Complete Production Variables List

#### Backend Service Variables (35+ variables)

**Core Configuration**
- `NODE_ENV=production`
- `PORT=3001`
- `HOST=0.0.0.0`

**Database**
- `DATABASE_URL` (auto-filled by Railway)
- `DB_POOL_MIN=2`
- `DB_POOL_MAX=20`
- `DB_POOL_ACQUIRE_TIMEOUT=60000`
- `DB_POOL_IDLE_TIMEOUT=10000`

**Session Management**
- `SESSION_SECRET` (32+ character random string)
- `SESSION_MAX_AGE=86400000`

**Security**
- `RATE_LIMIT_WINDOW_MS=900000`
- `RATE_LIMIT_MAX_REQUESTS=100`

**CORS**
- `FRONTEND_URL` (your frontend domain)
- `ALLOWED_ORIGINS` (comma-separated domains)

**Admin**
- `DEFAULT_ADMIN_USERNAME`
- `DEFAULT_ADMIN_PASSWORD`

**Email (SendGrid)**
- `SENDGRID_API_KEY`
- `EMAIL_FROM`
- `EMAIL_FROM_NAME`
- `EMAIL_REPLY_TO`
- `SUPPORT_EMAIL`

**Email (SMTP Fallback)**
- `EMAIL_HOST`
- `EMAIL_PORT`
- `EMAIL_USER`
- `EMAIL_PASS`
- `EMAIL_SECURE`

**Optional**
- `SMS_API_KEY`
- `SMS_PROVIDER`
- `LOG_LEVEL`
- `HEALTH_CHECK_PATH`

#### Frontend Service Variables

- `VITE_API_URL` (backend service URL)
- `NODE_ENV=production`

### Security Best Practices for Secrets

1. **Strong Secrets**: Use 32+ character random strings
2. **Unique Passwords**: Never reuse default passwords
3. **API Keys**: Store in Railway's encrypted variable system
4. **Database URLs**: Use Railway's auto-generated references
5. **Regular Rotation**: Change secrets periodically

### Railway Variable Management

1. **Service Variables**: Go to service → Variables tab
2. **Reference Other Services**: Use `${{ServiceName.VARIABLE}}`
3. **Environment Specific**: Create different environments for staging/production
4. **Bulk Import**: Use Railway CLI for bulk variable management

---

## 🚀 Deployment Process

### 1. Manual Deployment Steps

#### Step 1: Deploy Database
1. Create PostgreSQL service (completed above)
2. Wait for database to be ready
3. Note the `DATABASE_URL`

#### Step 2: Deploy Backend Service
1. Create backend service with repository
2. Set all required environment variables
3. Deploy and wait for health check to pass
4. Verify at: `https://your-backend.railway.app/health`

#### Step 3: Deploy Frontend Service
1. Create frontend service with repository
2. Set `VITE_API_URL` to backend service URL
3. Deploy and wait for completion
4. Verify at: `https://your-frontend.railway.app`

### 2. Automatic Deployment

Railway automatically deploys on:
- **Git Push**: Pushes to connected branch
- **Environment Changes**: Variable updates
- **Manual Trigger**: From Railway dashboard

### 3. Deployment Monitoring

Monitor deployment progress:
1. **Build Logs**: View real-time build output
2. **Deploy Status**: Green checkmark indicates success
3. **Health Checks**: Automatic health monitoring
4. **Metrics**: CPU, memory, and request metrics

### 4. Rollback Procedures

If deployment fails:
1. **Automatic Rollback**: Railway keeps previous version running
2. **Manual Rollback**: Click "Rollback" on previous deployment
3. **Git Revert**: Revert problematic commits and redeploy

---

## ✅ Post-Deployment Steps

### 1. Database Migration and Seeding

#### Verify Migration Success
1. Check backend service logs for migration output
2. Look for: `"Migration deployed successfully"`
3. Verify tables exist in Railway database browser

#### Manual Migration (if needed)
```bash
# Connect to backend service terminal
npx prisma migrate deploy
npx prisma db seed
```

### 2. Admin User Creation

#### Automatic Creation
The backend automatically creates admin user on startup using:
- `DEFAULT_ADMIN_USERNAME`
- `DEFAULT_ADMIN_PASSWORD`

#### Manual Verification
1. Visit: `https://your-frontend.railway.app/admin/login`
2. Login with configured credentials
3. Change password immediately after first login

### 3. Email Service Testing

#### Test Email Configuration
1. Access admin dashboard
2. Create a test request
3. Verify email notifications are sent
4. Check Railway logs for email service status

#### SendGrid Verification
1. Check SendGrid dashboard for sent emails
2. Verify domain authentication
3. Monitor bounce rates and deliverability

### 4. System Health Verification

#### Health Check Endpoints
- **Backend**: `https://your-backend.railway.app/health`
- **Frontend**: `https://your-frontend.railway.app/health`

#### Functional Testing
1. **Public Interface**: Submit help request
2. **Admin Interface**: Login and manage requests
3. **Calendar System**: Create and book time slots
4. **Email Notifications**: Verify email delivery

#### Performance Testing
1. **Response Times**: Check API response times
2. **Database Performance**: Monitor query performance
3. **Frontend Loading**: Verify fast page loads

---

## 🔧 Advanced Configuration

### 1. Redis Session Store Setup

For improved session management and horizontal scaling:

#### Add Redis Service
1. Click **"+ New Service"**
2. Select **"Database"**
3. Choose **"Redis"**
4. Railway provisions Redis automatically

#### Configure Backend for Redis
Add to backend environment variables:
```bash
REDIS_URL=${{Redis.REDIS_URL}}
```

#### Benefits of Redis Sessions
- **Scalability**: Support for multiple backend instances
- **Performance**: Faster session access
- **Persistence**: Sessions survive service restarts

### 2. Custom Domain with SSL

#### Domain Configuration
1. **Purchase Domain**: From your preferred registrar
2. **Add to Railway**: Service settings → Domains
3. **Update DNS**: Point CNAME to Railway domain
4. **SSL Certificate**: Auto-provisioned by Railway

#### DNS Configuration Example
```
Type: CNAME
Name: @
Value: your-service.railway.app
```

### 3. Performance Optimization

#### Database Optimization
- **Connection Pooling**: Configured via environment variables
- **Query Optimization**: Monitor slow queries in logs
- **Indexing**: Ensure proper database indexes

#### Frontend Optimization
- **Asset Caching**: Configured in nginx
- **Compression**: Gzip enabled for static assets
- **CDN**: Consider Railway's edge caching

#### Backend Optimization
- **Response Caching**: Implement API response caching
- **Database Caching**: Add Redis for query caching
- **Image Optimization**: Optimize static assets

### 4. Scaling Configuration

#### Horizontal Scaling
- **Multiple Instances**: Increase replica count
- **Load Balancing**: Automatic via Railway
- **Session Store**: Required Redis for multi-instance

#### Vertical Scaling
- **Memory Limits**: Adjust container memory
- **CPU Limits**: Configure CPU allocation
- **Database Resources**: Upgrade database plan

---

## 📊 Monitoring & Troubleshooting

### 1. Railway Logging Interface

#### Access Logs
1. **Service Logs**: Click service → Logs tab
2. **Real-time**: Live log streaming
3. **Historical**: Search previous logs
4. **Filtering**: Filter by severity level

#### Log Types
- **Application Logs**: Your app's console output
- **System Logs**: Railway platform logs
- **Build Logs**: Docker build output
- **Database Logs**: PostgreSQL logs

### 2. Common Deployment Issues

#### Database Connection Issues
```bash
# Error: Connection refused
# Solution: Check DATABASE_URL format
DATABASE_URL="postgresql://user:pass@host:port/db?sslmode=require"
```

#### Migration Failures
```bash
# Error: Migration failed
# Solution: Check database permissions and syntax
npx prisma migrate reset  # Last resort
```

#### Environment Variable Issues
```bash
# Error: Missing required environment variable
# Solution: Verify all required variables are set
```

#### Build Failures
```bash
# Error: Docker build failed
# Solution: Check Dockerfile syntax and dependencies
```

### 3. Performance Monitoring

#### Built-in Metrics
- **CPU Usage**: Monitor via Railway dashboard
- **Memory Usage**: Track memory consumption
- **Request Metrics**: Response times and error rates
- **Database Metrics**: Connection count and query performance

#### External Monitoring
- **Uptime Monitoring**: Use external services (Pingdom, UptimeRobot)
- **Application Monitoring**: Consider APM tools (DataDog, New Relic)
- **Log Aggregation**: External log services for advanced analysis

### 4. Backup and Disaster Recovery

#### Database Backups
- **Automatic Backups**: Railway provides automatic PostgreSQL backups
- **Manual Backups**: Export database via Railway dashboard
- **Backup Frequency**: Daily automatic backups retained for 7 days

#### Application Backups
- **Code Repository**: GitHub serves as code backup
- **Configuration**: Environment variables backed up with Railway project
- **File System**: Stateless containers don't require file backups

#### Disaster Recovery Plan
1. **Database Recovery**: Restore from Railway backup
2. **Application Recovery**: Redeploy from GitHub
3. **Configuration Recovery**: Restore environment variables
4. **DNS Recovery**: Update DNS if needed

---

## 🔒 Security Considerations

### Production Security Checklist

- [ ] Change all default passwords
- [ ] Use strong session secrets (32+ characters)
- [ ] Configure CORS properly
- [ ] Enable rate limiting
- [ ] Set up proper SSL/TLS
- [ ] Use environment variables for secrets
- [ ] Enable security headers
- [ ] Monitor access logs
- [ ] Regular security updates
- [ ] Backup encryption

### Network Security

- **Internal Communication**: Services communicate via Railway's private network
- **External Access**: Only necessary ports exposed
- **SSL Termination**: Handled by Railway edge
- **DDoS Protection**: Basic protection included

---

## 📈 Cost Optimization Tips

### 1. Service Optimization
- **Right-sizing**: Start with smaller instances, scale as needed
- **Sleep Mode**: Enable for development environments
- **Resource Monitoring**: Track actual usage vs allocated

### 2. Database Optimization
- **Connection Pooling**: Reduce database connections
- **Query Optimization**: Monitor and optimize slow queries
- **Data Retention**: Implement data archiving strategies

### 3. Traffic Optimization
- **Caching**: Implement response caching
- **CDN**: Use Railway's edge caching
- **Image Optimization**: Compress images and assets

---

## 🎯 Success Criteria

Your deployment is successful when:

- [ ] **Health Checks Pass**: All services return 200 on health endpoints
- [ ] **Database Connected**: Backend connects to PostgreSQL successfully
- [ ] **Migrations Applied**: All database tables created
- [ ] **Admin Access**: Can login to admin dashboard
- [ ] **Email Working**: Test emails sent successfully
- [ ] **Public Interface**: Help request form works
- [ ] **API Communication**: Frontend communicates with backend
- [ ] **Performance**: Response times under 2 seconds
- [ ] **Security**: All security headers present
- [ ] **Monitoring**: Logs accessible and readable

---

## 📞 Support Resources

### Railway Support
- **Documentation**: [docs.railway.app](https://docs.railway.app)
- **Community**: Railway Discord server
- **Support**: Railway support tickets

### HelpSavta Resources
- **Repository**: GitHub repository with issues
- **Documentation**: README.md and project documentation
- **Email Configuration**: SendGrid documentation

### Emergency Contacts
- **Railway Status**: [status.railway.app](https://status.railway.app)
- **SendGrid Status**: SendGrid status page
- **Database Issues**: Railway database support

---

**🎉 Congratulations! You've successfully deployed HelpSavta to Railway!**

*This guide provides comprehensive deployment instructions for the HelpSavta volunteer technical help platform. For updates and improvements, please refer to the project repository.*