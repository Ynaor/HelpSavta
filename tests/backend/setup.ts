import { config } from 'dotenv';

// Load test environment variables
config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'sqlite://test.db';

// Suppress console logs during tests unless DEBUG is set
if (!process.env.DEBUG) {
  const noop = () => {};
  console.log = noop;
  console.warn = noop;
  console.error = noop;
}