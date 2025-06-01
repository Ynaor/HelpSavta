#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '../prisma/schema.prisma');
const postgresqlSchemaPath = path.join(__dirname, '../prisma/schema.postgresql.prisma');
const envPath = path.join(__dirname, '../.env');

// Check if PostgreSQL schema exists
if (!fs.existsSync(postgresqlSchemaPath)) {
  console.error('❌ PostgreSQL schema not found at:', postgresqlSchemaPath);
  process.exit(1);
}

// Copy PostgreSQL schema to main schema
fs.copyFileSync(postgresqlSchemaPath, schemaPath);

// Update .env file if it exists
if (fs.existsSync(envPath)) {
  let envContent = fs.readFileSync(envPath, 'utf8');
  
  // Update DATABASE_URL to PostgreSQL format
  envContent = envContent.replace(
    /DATABASE_URL="file:\.\/dev\.db"/g,
    'DATABASE_URL="postgresql://helpsavta:helpsavta_dev_password@localhost:5432/helpsavta"'
  );
  
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Switched to PostgreSQL schema');
  console.log('✅ Updated .env with PostgreSQL DATABASE_URL');
  console.log('🐳 Make sure PostgreSQL is running: docker-compose up -d postgres');
} else {
  console.log('✅ Switched to PostgreSQL schema');
  console.log('💡 Make sure your .env has: DATABASE_URL="postgresql://helpsavta:helpsavta_dev_password@localhost:5432/helpsavta"');
  console.log('🐳 For Docker: Make sure PostgreSQL is running: docker-compose up -d postgres');
}