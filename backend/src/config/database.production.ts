import { PrismaClient } from '@prisma/client';
import { environment } from './environment';

// PostgreSQL connection configuration for production
const productionDatabaseConfig = {
  // Connection URL with SSL for production
  datasourceUrl: environment.database.url,
  
  // Connection pool configuration
  connectionString: environment.database.url,
  
  // SSL configuration for production PostgreSQL
  ssl: environment.isProduction ? {
    rejectUnauthorized: false, // Set to true if using verified SSL certificates
  } : undefined,
  
  // Connection pool settings
  pool: {
    min: environment.database.pool.min,
    max: environment.database.pool.max,
    acquireTimeoutMillis: environment.database.pool.acquireTimeoutMillis,
    idleTimeoutMillis: environment.database.pool.idleTimeoutMillis,
  },
  
  // Query timeout settings
  queryTimeout: 30000, // 30 seconds
  
  // Connection timeout
  connectionTimeout: 10000, // 10 seconds
  
  // Logging configuration
  log: environment.isProduction 
    ? ['error'] 
    : ['query', 'info', 'warn', 'error'],
};

// Prisma Client configuration for different environments
export const createPrismaClient = (): PrismaClient => {
  const config: any = {
    datasources: {
      db: {
        url: environment.database.url,
      },
    },
    log: productionDatabaseConfig.log,
  };

  // Add connection pool configuration for production
  if (environment.isProduction || environment.isStaging) {
    config.datasources.db.url += '?connection_limit=20&pool_timeout=20';
  }

  return new PrismaClient(config);
};

// Database health check function
export const checkDatabaseConnection = async (prisma: PrismaClient): Promise<boolean> => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database connection check failed:', error);
    return false;
  }
};

// Database migration status check
export const checkMigrationStatus = async (prisma: PrismaClient): Promise<boolean> => {
  try {
    // Check if the _prisma_migrations table exists and has applied migrations
    const result = await prisma.$queryRaw`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_name = '_prisma_migrations' 
      AND table_schema = 'public'
    ` as any[];
    
    return result[0]?.count > 0;
  } catch (error) {
    console.error('Migration status check failed:', error);
    return false;
  }
};

// Database performance optimization for PostgreSQL
export const optimizeDatabase = async (prisma: PrismaClient): Promise<void> => {
  try {
    if (environment.isProduction) {
      // Create indexes for better performance
      await prisma.$executeRaw`
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tech_requests_status 
        ON tech_requests(status);
      `;
      
      await prisma.$executeRaw`
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tech_requests_created_at 
        ON tech_requests(created_at);
      `;
      
      await prisma.$executeRaw`
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tech_requests_assigned_admin 
        ON tech_requests(assigned_admin_id);
      `;
      
      await prisma.$executeRaw`
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_available_slots_date 
        ON available_slots(date);
      `;
      
      await prisma.$executeRaw`
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_available_slots_is_booked 
        ON available_slots(is_booked);
      `;
      
      await prisma.$executeRaw`
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_admin_users_username 
        ON admin_users(username);
      `;
      
      await prisma.$executeRaw`
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_admin_users_is_active 
        ON admin_users(is_active);
      `;
      
      await prisma.$executeRaw`
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notification_logs_sent_at 
        ON notification_logs(sent_at);
      `;
      
      console.log('Database indexes created successfully');
    }
  } catch (error) {
    console.error('Failed to optimize database:', error);
    // Don't throw error as indexes might already exist
  }
};

// Connection cleanup function
export const closeDatabaseConnection = async (prisma: PrismaClient): Promise<void> => {
  try {
    await prisma.$disconnect();
    console.log('Database connection closed successfully');
  } catch (error) {
    console.error('Error closing database connection:', error);
  }
};

// Database backup configuration (for use with pg_dump)
export const getBackupConfig = () => {
  const dbUrl = new URL(environment.database.url);
  
  return {
    host: dbUrl.hostname,
    port: dbUrl.port || '5432',
    database: dbUrl.pathname.slice(1), // Remove leading '/'
    username: dbUrl.username,
    password: dbUrl.password,
    
    // Backup command template
    backupCommand: `pg_dump -h ${dbUrl.hostname} -p ${dbUrl.port || '5432'} -U ${dbUrl.username} -d ${dbUrl.pathname.slice(1)} --no-password --clean --if-exists --create`,
    
    // Restore command template
    restoreCommand: `psql -h ${dbUrl.hostname} -p ${dbUrl.port || '5432'} -U ${dbUrl.username} -d ${dbUrl.pathname.slice(1)}`,
  };
};

export default productionDatabaseConfig;