#!/bin/sh
set -e

echo "Starting HelpSavta Backend..."

# Environment detection
ENVIRONMENT=${NODE_ENV:-development}
echo "🌍 Environment: $ENVIRONMENT"

echo "Running database migrations..."
npx prisma migrate deploy

# Production-safe seeding
echo "Checking seeding requirements..."
if [ "$ENVIRONMENT" = "production" ]; then
    echo "🛡️  PRODUCTION: Seeding with production safeguards"
    if [ "$SKIP_PRODUCTION_SEEDING" = "true" ]; then
        echo "🚨 PRODUCTION: Seeding completely skipped due to SKIP_PRODUCTION_SEEDING=true"
    else
        echo "🛡️  PRODUCTION: Running safe seeding (will preserve existing data)"
        npx prisma db seed
    fi
else
    echo "🌱 DEVELOPMENT: Running full seeding"
    npx prisma db seed
fi

echo "Starting application..."
exec node dist/server.js