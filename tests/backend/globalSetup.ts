export default async () => {
  // Global setup for tests
  process.env.NODE_ENV = 'test';
  
  // Set test database URL if not already set
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = 'sqlite://test.db';
  }
  
  console.log('Jest global setup completed');
};