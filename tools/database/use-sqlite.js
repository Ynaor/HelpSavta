#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '../prisma/schema.prisma');
const envPath = path.join(__dirname, '../.env');

// Read the current schema
const currentSchema = fs.readFileSync(schemaPath, 'utf8');

// Update provider to sqlite
const sqliteSchema = currentSchema.replace(
  /provider\s*=\s*"postgresql"/g,
  'provider = "sqlite"'
);

// Write the updated schema
fs.writeFileSync(schemaPath, sqliteSchema);

// Update .env file if it exists
if (fs.existsSync(envPath)) {
  let envContent = fs.readFileSync(envPath, 'utf8');
  
  // Update DATABASE_URL to SQLite format
  envContent = envContent.replace(
    /DATABASE_URL="postgresql:\/\/[^"]+"/g,
    'DATABASE_URL="file:./dev.db"'
  );
  
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Switched to SQLite schema');
  console.log('✅ Updated .env with SQLite DATABASE_URL');
} else {
  console.log('✅ Switched to SQLite schema');
  console.log('💡 Make sure your .env has: DATABASE_URL="file:./dev.db"');
}