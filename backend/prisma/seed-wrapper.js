#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Check if we're in production (compiled files exist) or development
const compiledSeedPath = path.join(__dirname, '../dist/prisma/seed.js');
const tsSeedPath = path.join(__dirname, 'seed.ts');

if (fs.existsSync(compiledSeedPath)) {
    // Production: use compiled JavaScript
    console.log('🚀 Running seed from compiled JavaScript (production mode)');
    require(compiledSeedPath);
} else if (fs.existsSync(tsSeedPath)) {
    // Development: use ts-node for TypeScript
    console.log('🌱 Running seed from TypeScript (development mode)');
    require('ts-node/register');
    require(tsSeedPath);
} else {
    console.error('❌ Neither compiled seed.js nor seed.ts found');
    process.exit(1);
}