# Docker Compose Local Testing Environment

This guide provides instructions for setting up and testing the HelpSavta backend with PostgreSQL using Docker Compose.

## Quick Start

Run the automated test script:

```bash
./docker-compose.test.sh
```

This script will:
- Clean up any existing containers
- Build and start PostgreSQL and backend services
- Wait for services to be ready
- Run comprehensive tests
- Provide detailed status information

## Manual Setup

### Prerequisites

- Docker and Docker Compose installed
- No services running on ports 3001 (backend) and 5432 (PostgreSQL)

### 1. Start Services

```bash
# Build and start all services
docker-compose up --build -d

# View logs
docker-compose logs -f
```

### 2. Verify Services

**Check service status:**
```bash
docker-compose ps
```

**Test backend health:**
```bash
curl http://localhost:3001/health
```

**Access PostgreSQL:**
```bash
docker exec -it helpsavta-postgres psql -U helpsavta_user -d helpsavta_db
```

## Service Configuration

### PostgreSQL
- **Host:** localhost:5432
- **Database:** helpsavta_db
- **User:** helpsavta_user
- **Password:** helpsavta_password

### Backend API
- **URL:** http://localhost:3001
- **Health Check:** http://localhost:3001/health
- **Default Admin:** admin / admin123

## Environment Variables

The Docker Compose setup uses environment variables defined in:
- [`docker-compose.yml`](./docker-compose.yml) - Main service configuration
- [`backend/.env.docker`](./backend/.env.docker) - Reference environment file

Key configurations:
- `NODE_ENV=development`
- `DATABASE_URL=postgresql://helpsavta_user:helpsavta_password@postgres:5432/helpsavta_db`
- `DEFAULT_ADMIN_USERNAME=admin`
- `DEFAULT_ADMIN_PASSWORD=admin123`

## Database Operations

### View Tables
```bash
docker exec -it helpsavta-postgres psql -U helpsavta_user -d helpsavta_db -c "\dt"
```

### Run Migrations Manually
```bash
docker exec -it helpsavta-backend npx prisma migrate deploy
```

### Run Seeding Manually
```bash
docker exec -it helpsavta-backend npx prisma db seed
```

### Reset Database
```bash
# Stop services and remove volumes
docker-compose down -v

# Start fresh
docker-compose up --build -d
```

## Troubleshooting

### Services Won't Start

1. **Check port conflicts:**
   ```bash
   lsof -i :3001  # Backend port
   lsof -i :5432  # PostgreSQL port
   ```

2. **View detailed logs:**
   ```bash
   docker-compose logs postgres
   docker-compose logs backend
   ```

3. **Clean restart:**
   ```bash
   docker-compose down -v --remove-orphans
   docker system prune -f --volumes
   docker-compose up --build -d
   ```

### Database Connection Issues

1. **Verify PostgreSQL is ready:**
   ```bash
   docker exec helpsavta-postgres pg_isready -U helpsavta_user -d helpsavta_db
   ```

2. **Check database connectivity from backend:**
   ```bash
   docker exec -it helpsavta-backend npm run db:generate
   ```

### Backend Build Issues

1. **Check TypeScript compilation:**
   ```bash
   docker exec -it helpsavta-backend npm run build
   ```

2. **Verify built files exist:**
   ```bash
   docker exec -it helpsavta-backend ls -la dist/
   docker exec -it helpsavta-backend ls -la dist/prisma/
   ```

### Email Testing

The Docker setup includes basic email configuration. To test email functionality:

1. Update email credentials in `docker-compose.yml` or `backend/.env.docker`
2. Restart backend service:
   ```bash
   docker-compose restart backend
   ```

## API Testing

### Health Check
```bash
curl http://localhost:3001/health
```

### Test Endpoints
```bash
# Test endpoint (if implemented)
curl http://localhost:3001/api/test

# Get available slots
curl http://localhost:3001/api/slots

# Create a tech request (POST with data)
curl -X POST http://localhost:3001/api/requests \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Test User",
    "phone": "123-456-7890",
    "email": "test@example.com",
    "address": "123 Test St",
    "problem_description": "Test problem",
    "urgency_level": "medium"
  }'
```

## Development Workflow

1. **Make code changes** in the `backend/src/` directory
2. **Rebuild backend:**
   ```bash
   docker-compose build backend
   docker-compose up -d backend
   ```
3. **View logs:**
   ```bash
   docker-compose logs -f backend
   ```

## Cleanup

### Stop Services
```bash
docker-compose down
```

### Remove Everything (including data)
```bash
docker-compose down -v --remove-orphans
docker system prune -f --volumes
```

## Production Differences

This Docker setup is configured for **local testing only**. Key differences from production:

- Uses development environment (`NODE_ENV=development`)
- Includes default admin credentials
- No email encryption/authentication
- Simplified logging configuration
- No reverse proxy or SSL termination

Before deploying to Railway or production:
- Review and update environment variables
- Change default admin credentials
- Configure proper email service (SendGrid)
- Enable production security settings

## Files Created

- [`docker-compose.yml`](./docker-compose.yml) - Main Docker Compose configuration
- [`backend/.env.docker`](./backend/.env.docker) - Docker environment variables reference
- [`docker-compose.test.sh`](./docker-compose.test.sh) - Automated testing script
- [`DOCKER_SETUP.md`](./DOCKER_SETUP.md) - This documentation file

## Next Steps

After verifying the local Docker environment works correctly:

1. Test all API endpoints manually or with automated tests
2. Verify database operations (CRUD operations)
3. Test email functionality (if configured)
4. Deploy to Railway with confidence that the containerized setup works