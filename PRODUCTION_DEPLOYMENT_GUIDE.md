# ARCHIVED: HelpSavta Production Deployment Guide

**ARCHIVED**: This file has been consolidated into the main deployment documentation.

**Replacement Guide**: [`DEPLOYMENT.md`](DEPLOYMENT.md:1)

This content has been integrated into the comprehensive deployment guide to eliminate duplication and provide a single source of truth for production deployment procedures.

**Date Archived**: May 29, 2025
**Reason**: Documentation consolidation

## 🎯 Pre-Deployment Checklist

### ✅ Infrastructure Requirements
- [ ] **PostgreSQL 12+** installed and configured
- [ ] **Redis** installed for session storage
- [ ] **Nginx** for reverse proxy and SSL termination
- [ ] **Node.js 18+** and npm installed
- [ ] **SSL certificates** obtained and configured
- [ ] **Firewall** configured with appropriate ports
- [ ] **Backup storage** configured (local/cloud)

### ✅ Environment Setup
- [ ] Production server provisioned
- [ ] Domain name configured and DNS pointed to server
- [ ] SSL certificates installed
- [ ] PostgreSQL database and user created
- [ ] Redis configured and secured
- [ ] Application user account created (`helpsavta`)

## 🚀 Step-by-Step Deployment

### Step 1: Server Preparation

#### 1.1 Create Application User
```bash
# Create dedicated user for the application
sudo useradd -m -s /bin/bash helpsavta
sudo usermod -aG sudo helpsavta

# Create application directory
sudo mkdir -p /opt/helpsavta
sudo chown -R helpsavta:helpsavta /opt/helpsavta
```

#### 1.2 Install System Dependencies
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

### Step 2: Database Setup

#### 2.1 Configure PostgreSQL
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

#### 2.2 Configure PostgreSQL Security
```bash
# Edit PostgreSQL configuration
sudo nano /etc/postgresql/14/main/postgresql.conf

# Add these settings:
listen_addresses = 'localhost'
max_connections = 100
shared_buffers = 256MB
effective_cache_size = 1GB
```

#### 2.3 Configure Redis
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

### Step 3: Application Deployment

#### 3.1 Deploy Application Code
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

#### 3.2 Configure Environment
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

#### 3.3 Run Production Setup
```bash
# Run automated production setup
npm run production:setup setup

# This will:
# - Check prerequisites
# - Verify environment configuration
# - Install dependencies
# - Setup database schema
# - Optimize database with indexes
# - Generate system configuration files
```

### Step 4: Database Migration

#### 4.1 Migrate Data from Development
If you have existing SQLite data to migrate:

```bash
# Ensure development .env is available for SQLite connection
# Run migration script
npm run migrate:postgresql

# Verify migration completed successfully
npm run db:monitor report
```

#### 4.2 Initial Database Setup (New Installation)
```bash
# Generate Prisma client
npm run db:generate

# Deploy database schema
npm run db:migrate:deploy

# Seed initial data
npm run db:seed
```

### Step 5: System Configuration

#### 5.1 Configure Systemd Service
```bash
# Copy generated service file
sudo cp /tmp/helpsavta-backend.service /etc/systemd/system/

# Reload systemd and enable service
sudo systemctl daemon-reload
sudo systemctl enable helpsavta-backend

# Start the service
sudo systemctl start helpsavta-backend

# Check service status
sudo systemctl status helpsavta-backend
```

#### 5.2 Configure Nginx
```bash
# Copy generated nginx configuration
sudo cp /tmp/helpsavta-backend.nginx.conf /etc/nginx/sites-available/helpsavta

# Enable the site
sudo ln -s /etc/nginx/sites-available/helpsavta /etc/nginx/sites-enabled/

# Test nginx configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

#### 5.3 Configure SSL (Let's Encrypt)
```bash
# Install certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Verify auto-renewal
sudo certbot renew --dry-run
```

### Step 6: Security Configuration

#### 6.1 Configure Firewall
```bash
# Configure UFW firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

# Check firewall status
sudo ufw status
```

#### 6.2 Configure Log Rotation
```bash
# Create log rotation configuration
sudo nano /etc/logrotate.d/helpsavta

# Add configuration:
/var/log/helpsavta/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 0644 helpsavta helpsavta
    postrotate
        systemctl reload helpsavta-backend
    endscript
}
```

### Step 7: Monitoring and Maintenance

#### 7.1 Setup Database Monitoring
```bash
# Generate monitoring queries
npm run db:monitor queries > /opt/helpsavta/backend/monitoring-queries.sql

# Setup monitoring cron job
sudo su - helpsavta
crontab -e

# Add these entries:
# Database health check every 15 minutes
*/15 * * * * cd /opt/helpsavta/backend && npm run db:monitor report >> /var/log/helpsavta/db-health.log 2>&1

# Daily backup at 2 AM
0 2 * * * cd /opt/helpsavta/backend && npm run backup-restore backup >> /var/log/helpsavta/backup.log 2>&1

# Weekly backup cleanup (keep 4 weeks)
0 3 * * 0 cd /opt/helpsavta/backend && npm run backup-restore clean 28 >> /var/log/helpsavta/backup.log 2>&1
```

#### 7.2 Setup Application Monitoring
```bash
# Create log directory
sudo mkdir -p /var/log/helpsavta
sudo chown -R helpsavta:helpsavta /var/log/helpsavta

# Configure application logging in systemd service
# (Already included in generated service file)
```

## 🔧 Post-Deployment Verification

### Verification Checklist
- [ ] **Application Status**: `sudo systemctl status helpsavta-backend`
- [ ] **Database Connection**: `npm run db:monitor report`
- [ ] **Health Endpoint**: `curl https://yourdomain.com/health`
- [ ] **API Endpoints**: Test all critical API endpoints
- [ ] **SSL Certificate**: Verify SSL is working correctly
- [ ] **Backup System**: Test backup creation and restoration
- [ ] **Log Rotation**: Verify logs are being rotated
- [ ] **Monitoring**: Check all monitoring systems

### Performance Testing
```bash
# Test API performance
curl -w "@curl-format.txt" -o /dev/null -s https://yourdomain.com/health

# Create curl-format.txt:
echo "
    time_namelookup:  %{time_namelookup}s
         time_connect:  %{time_connect}s
      time_appconnect:  %{time_appconnect}s
     time_pretransfer:  %{time_pretransfer}s
        time_redirect:  %{time_redirect}s
   time_starttransfer:  %{time_starttransfer}s
                     ----------
           time_total:  %{time_total}s
" > curl-format.txt
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Database Connection Failed
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check connection
sudo -u postgres psql -c "SELECT version();"

# Verify database exists
sudo -u postgres psql -l | grep helpsavta_db
```

#### 2. Application Won't Start
```bash
# Check application logs
sudo journalctl -u helpsavta-backend -f

# Check environment configuration
cd /opt/helpsavta/backend
npm run production:setup check
```

#### 3. High Memory Usage
```bash
# Monitor memory usage
free -h
ps aux --sort=-%mem | head

# Check PostgreSQL memory
sudo -u postgres psql -c "SHOW shared_buffers;"
sudo -u postgres psql -c "SHOW work_mem;"
```

#### 4. SSL Certificate Issues
```bash
# Check certificate status
sudo certbot certificates

# Renew certificates
sudo certbot renew --force-renewal
```

## 🔄 Maintenance Procedures

### Daily Maintenance
- [ ] Check application health: `npm run db:monitor report`
- [ ] Review application logs: `sudo journalctl -u helpsavta-backend --since today`
- [ ] Monitor disk space: `df -h`

### Weekly Maintenance
- [ ] Review backup integrity
- [ ] Check SSL certificate expiration
- [ ] Update system packages: `sudo apt update && sudo apt upgrade`
- [ ] Review performance metrics

### Monthly Maintenance
- [ ] Database maintenance: Run VACUUM and ANALYZE
- [ ] Log cleanup: Review and clean old logs
- [ ] Security updates: Apply all security patches
- [ ] Performance review: Analyze slow queries and optimize

## 📊 Monitoring Commands

```bash
# Application health
npm run db:monitor report
npm run db:monitor watch

# System health
sudo systemctl status helpsavta-backend
sudo systemctl status postgresql
sudo systemctl status redis
sudo systemctl status nginx

# Performance monitoring
htop
iotop
nethogs
```

## 🔐 Security Best Practices

1. **Regular Updates**: Keep all systems updated
2. **Strong Passwords**: Use strong, unique passwords
3. **Limited Access**: Restrict SSH access and use key-based authentication
4. **Regular Backups**: Maintain regular, tested backups
5. **Monitoring**: Set up comprehensive monitoring and alerting
6. **SSL/TLS**: Always use HTTPS in production
7. **Firewall**: Maintain restrictive firewall rules
8. **Log Monitoring**: Regularly review logs for suspicious activity

---

**Deployment Status**: Ready for Production  
**Last Updated**: Deployment guide completion  
**Version**: 1.0.0  
**Support**: Follow troubleshooting guide or contact system administrator