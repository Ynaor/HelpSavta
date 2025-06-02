# PostgreSQL Setup for HelpSavta Development

## Quick Setup Guide

### 1. Install PostgreSQL

**macOS (using Homebrew):**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**Windows:**
Download and install from: https://www.postgresql.org/download/windows/

### 2. Create Database and User

```bash
# Connect to PostgreSQL as superuser
psql postgres

# Create database and user
CREATE DATABASE helpsavta_dev;
CREATE USER postgres WITH PASSWORD 'postgres';
GRANT ALL PRIVILEGES ON DATABASE helpsavta_dev TO postgres;

# Exit psql
\q
```

### 3. Verify Connection

Test that the DATABASE_URL in `.env` works:
```bash
psql "postgresql://postgres:postgres@localhost:5432/helpsavta_dev"
```

If successful, you should see:
```
psql (15.x)
Type "help" for help.

helpsavta_dev=>
```

Type `\q` to exit.

### 4. Run Database Setup

```bash
npm run db:setup
```

## Alternative: Using Docker

If you prefer Docker, create a `docker-compose.dev.yml`:

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: helpsavta_dev
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

Start with:
```bash
docker-compose -f docker-compose.dev.yml up -d
```

## Troubleshooting

### Connection Refused
- Ensure PostgreSQL is running: `brew services list | grep postgresql`
- Check port 5432 is not blocked: `telnet localhost 5432`

### Authentication Failed
- Verify username/password in DATABASE_URL
- Reset PostgreSQL password if needed

### Database Does Not Exist
- Run the database creation commands above
- Ensure the database name matches the .env file

### Permission Denied
- Ensure the postgres user has proper permissions
- Try connecting as superuser first

## Environment Variables

The current `.env` configuration:
```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/helpsavta_dev"
```

Format: `postgresql://[user]:[password]@[host]:[port]/[database]`

## Production Notes

For production deployment:
1. Use strong passwords
2. Create dedicated database user with limited privileges
3. Use SSL connections
4. Consider using connection pooling (PgBouncer)
5. Set up regular backups

## Migration Commands

After setup, useful commands:
```bash
# Reset database (careful - deletes all data!)
npm run db:reset

# Apply migrations
npm run db:migrate

# Seed with test data
npm run db:seed

# Open Prisma Studio
npm run db:studio