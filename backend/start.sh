#!/bin/sh
set -e

echo "Starting HelpSavta Backend..."

echo "Running database migrations..."
npx prisma migrate deploy

echo "Seeding database..."
npx prisma db seed

echo "Starting application..."
exec node dist/server.js