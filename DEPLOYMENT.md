# Deployment Guide / מדריך פריסה - TechHelp4U

## Production Deployment / פריסה לייצור

This guide covers deploying the TechHelp4U application to production environments.

### Prerequisites / דרישות מקדימות

- Node.js 18+ on production server
- Domain name and SSL certificate
- Database (PostgreSQL recommended for production)
- Reverse proxy (Nginx recommended)

## Deployment Options / אפשרויות פריסה

### Option 1: Traditional VPS/Server Deployment

#### 1. Server Setup / הגדרת שרת

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Install Nginx
sudo apt install nginx -y

# Install PostgreSQL (optional, for production database)
sudo apt install postgresql postgresql-contrib -y
```

#### 2. Application Setup / הגדרת האפליקציה

```bash
# Clone repository
git clone <your-repo-url> /opt/techhelp4u
cd /opt/techhelp4u

# Install dependencies
npm install
cd backend && npm install
cd ../frontend && npm install
cd ..

# Build frontend
cd frontend && npm run build
cd ..

# Setup environment variables
cp backend/.env.example backend/.env
nano backend/.env
```

#### 3. Database Setup / הגדרת מסד נתונים

##### SQLite (Simple)
```bash
cd backend
npm run db:generate
npm run db:push
npm run db:seed
```

##### PostgreSQL (Recommended for production)
```bash
# Create database
sudo -u postgres createdb techhelp4u

# Update .env file
DATABASE_URL="postgresql://username:password@localhost:5432/techhelp4u"

# Run migrations
cd backend
npm run db:generate
npm run db:push
npm run db:seed
```

#### 4. Build Backend / בניית Backend

```bash
cd backend
npm run build
```

#### 5. PM2 Configuration / תצורת PM2

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'techhelp4u-backend',
    script: './dist/server.js',
    cwd: './backend',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

Start with PM2:
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

#### 6. Nginx Configuration / תצורת Nginx

Create `/etc/nginx/sites-available/techhelp4u`:

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;

    # Modern SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";

    # Frontend static files
    location / {
        root /opt/techhelp4u/frontend/dist;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # API proxy
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/techhelp4u /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Option 2: Docker Deployment

#### 1. Backend Dockerfile

Create `backend/Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build application
RUN npm run build

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

USER nodejs

EXPOSE 3001

CMD ["npm", "start"]
```

#### 2. Frontend Dockerfile

Create `frontend/Dockerfile`:

```dockerfile
FROM node:18-alpine as builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build application
RUN npm run build

FROM nginx:alpine

# Copy built files
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

#### 3. Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  database:
    image: postgres:15
    environment:
      POSTGRES_DB: techhelp4u
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  backend:
    build: ./backend
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@database:5432/techhelp4u
      SESSION_SECRET: ${SESSION_SECRET}
      FRONTEND_URL: https://your-domain.com
    depends_on:
      - database
    restart: unless-stopped

  frontend:
    build: ./frontend
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - backend
    restart: unless-stopped

volumes:
  postgres_data:
```

### Option 3: Cloud Platform Deployment

#### Heroku Deployment

1. **Prepare for Heroku:**

Create `Procfile`:
```
web: cd backend && npm start
```

Create `package.json` in root:
```json
{
  "name": "techhelp4u",
  "scripts": {
    "build": "cd backend && npm run build && cd ../frontend && npm run build",
    "start": "cd backend && npm start",
    "heroku-postbuild": "npm run build"
  }
}
```

2. **Deploy:**
```bash
heroku create your-app-name
heroku addons:create heroku-postgresql:hobby-dev
heroku config:set NODE_ENV=production
heroku config:set SESSION_SECRET=your-secret-key
git push heroku main
```

#### DigitalOcean App Platform

Create `.do/app.yaml`:

```yaml
name: techhelp4u
services:
- name: backend
  source_dir: backend
  github:
    repo: your-username/techhelp4u
    branch: main
  run_command: npm start
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  envs:
  - key: NODE_ENV
    value: production
  - key: DATABASE_URL
    value: ${DATABASE_URL}

- name: frontend
  source_dir: frontend
  github:
    repo: your-username/techhelp4u
    branch: main
  build_command: npm run build
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs

databases:
- name: db
  engine: PG
  size: basic-xs
```

## Environment Configuration / תצורת סביבה

### Production Environment Variables

Create `backend/.env` for production:

```env
# Database
DATABASE_URL="postgresql://username:password@host:5432/database"

# Server
NODE_ENV=production
PORT=3001

# Security
SESSION_SECRET=your-very-long-random-secret-key
FRONTEND_URL=https://your-domain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Admin (change these!)
DEFAULT_ADMIN_USERNAME=admin
DEFAULT_ADMIN_PASSWORD=change-this-password

# Optional: Notifications
SMS_API_KEY=your-sms-api-key
EMAIL_FROM=noreply@your-domain.com
```

## Security Checklist / רשימת בדיקות אבטחה

- [ ] Change default admin credentials
- [ ] Use strong SESSION_SECRET
- [ ] Enable HTTPS/SSL
- [ ] Configure firewall
- [ ] Set up database backups
- [ ] Configure rate limiting
- [ ] Enable security headers
- [ ] Regular security updates
- [ ] Monitor application logs
- [ ] Set up intrusion detection

## Performance Optimization / אופטימיזציה לביצועים

### Backend Optimizations
- Use connection pooling for database
- Enable response compression
- Implement caching where appropriate
- Use CDN for static assets
- Monitor with APM tools

### Frontend Optimizations
- Enable Gzip compression
- Set proper cache headers
- Optimize images
- Use service worker for caching
- Implement lazy loading

## Monitoring & Logging / ניטור ולוגים

### Log Management
```bash
# PM2 logs
pm2 logs

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Health Monitoring
```bash
# Check application health
curl https://your-domain.com/health

# Monitor with PM2
pm2 monit
```

## Backup Strategy / אסטרטגיית גיבוי

### Database Backup
```bash
# PostgreSQL backup
pg_dump -h localhost -U username -d techhelp4u > backup_$(date +%Y%m%d_%H%M%S).sql

# SQLite backup
cp backend/dev.db backup_$(date +%Y%m%d_%H%M%S).db
```

### Automated Backup Script
```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/backups"

# Create backup directory
mkdir -p $BACKUP_DIR

# Database backup
pg_dump -h localhost -U techhelp4u -d techhelp4u > $BACKUP_DIR/db_$DATE.sql

# Application backup
tar -czf $BACKUP_DIR/app_$DATE.tar.gz /opt/techhelp4u

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
```

## Troubleshooting / פתרון בעיות

### Common Issues

1. **Database Connection Issues:**
   - Check DATABASE_URL format
   - Verify database server is running
   - Check firewall rules

2. **Permission Errors:**
   - Ensure proper file permissions
   - Check user/group ownership
   - Verify write access to logs directory

3. **Memory Issues:**
   - Monitor memory usage
   - Adjust PM2 instance count
   - Check for memory leaks

4. **SSL/HTTPS Issues:**
   - Verify certificate validity
   - Check certificate chain
   - Ensure proper SSL configuration

### Useful Commands

```bash
# Check disk space
df -h

# Check memory usage
free -h

# Check process status
pm2 status

# Restart application
pm2 restart techhelp4u-backend

# View application logs
pm2 logs techhelp4u-backend

# Check Nginx status
sudo systemctl status nginx

# Test Nginx configuration
sudo nginx -t
```

## Updates & Maintenance / עדכונים ותחזוקה

### Updating the Application

```bash
# 1. Backup current version
sudo tar -czf /opt/backups/app_before_update_$(date +%Y%m%d).tar.gz /opt/techhelp4u

# 2. Pull latest changes
cd /opt/techhelp4u
git pull origin main

# 3. Update dependencies
npm install
cd backend && npm install
cd ../frontend && npm install && npm run build
cd ..

# 4. Run database migrations if needed
cd backend
npm run db:push

# 5. Restart application
pm2 restart techhelp4u-backend

# 6. Test the application
curl https://your-domain.com/health
```

---

**For additional help, consult the main README.md or create an issue in the repository.**