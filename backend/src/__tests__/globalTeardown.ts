export default async () => {
  // Global teardown for tests
  console.log('Jest global teardown completed');
  
  // Clean up test database if using SQLite
  if (process.env.DATABASE_URL?.includes('sqlite://test.db')) {
    const fs = require('fs');
    const path = require('path');
    
    try {
      const dbPath = path.join(process.cwd(), 'test.db');
      if (fs.existsSync(dbPath)) {
        fs.unlinkSync(dbPath);
        console.log('Test database cleaned up');
      }
    } catch (error) {
      console.warn('Could not clean up test database:', error);
    }
  }
};