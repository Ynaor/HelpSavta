import { createPrismaClient, checkDatabaseConnection } from '../src/config/database.production';
import { environment } from '../src/config/environment';

interface DatabaseStats {
  connectionStatus: boolean;
  recordCounts: {
    techRequests: number;
    availableSlots: number;
    adminUsers: number;
    notificationLogs: number;
  };
  performance: {
    avgResponseTime: number;
    activeConnections: number;
    databaseSize: string;
  };
  indexUsage: Array<{
    tableName: string;
    indexName: string;
    scans: number;
    tuplesRead: number;
  }>;
  recentActivity: {
    requestsLastHour: number;
    slotsCreatedToday: number;
    notificationsSentToday: number;
  };
}

// Get database statistics
async function getDatabaseStats(): Promise<DatabaseStats> {
  const prisma = createPrismaClient();
  
  try {
    const startTime = Date.now();
    
    // Check connection
    const connectionStatus = await checkDatabaseConnection(prisma);
    
    // Get record counts
    const [techRequests, availableSlots, adminUsers, notificationLogs] = await Promise.all([
      prisma.techRequest.count(),
      prisma.availableSlot.count(),
      prisma.adminUser.count(),
      prisma.notificationLog.count(),
    ]);

    const responseTime = Date.now() - startTime;

    // Get recent activity (last hour and today)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [requestsLastHour, slotsCreatedToday, notificationsSentToday] = await Promise.all([
      prisma.techRequest.count({
        where: { created_at: { gte: oneHourAgo } }
      }),
      prisma.availableSlot.count({
        where: { created_at: { gte: startOfToday } }
      }),
      prisma.notificationLog.count({
        where: { sent_at: { gte: startOfToday } }
      }),
    ]);

    // Get PostgreSQL specific stats (if available)
    let activeConnections = 0;
    let databaseSize = 'N/A';
    let indexUsage: any[] = [];

    if (environment.isProduction || environment.isStaging) {
      try {
        // Active connections
        const connectionResult = await prisma.$queryRaw`
          SELECT count(*) as count 
          FROM pg_stat_activity 
          WHERE datname = current_database()
        ` as any[];
        activeConnections = connectionResult[0]?.count || 0;

        // Database size
        const sizeResult = await prisma.$queryRaw`
          SELECT pg_size_pretty(pg_database_size(current_database())) as size
        ` as any[];
        databaseSize = sizeResult[0]?.size || 'N/A';

        // Index usage
        indexUsage = await prisma.$queryRaw`
          SELECT 
            schemaname,
            tablename,
            indexname,
            idx_scan,
            idx_tup_read
          FROM pg_stat_user_indexes 
          WHERE schemaname = 'public'
          ORDER BY idx_scan DESC
          LIMIT 10
        ` as any[];

      } catch (error) {
        console.warn('PostgreSQL stats not available:', error);
      }
    }

    return {
      connectionStatus,
      recordCounts: {
        techRequests,
        availableSlots,
        adminUsers,
        notificationLogs,
      },
      performance: {
        avgResponseTime: responseTime,
        activeConnections,
        databaseSize,
      },
      indexUsage: indexUsage.map((row: any) => ({
        tableName: row.tablename,
        indexName: row.indexname,
        scans: parseInt(row.idx_scan) || 0,
        tuplesRead: parseInt(row.idx_tup_read) || 0,
      })),
      recentActivity: {
        requestsLastHour,
        slotsCreatedToday,
        notificationsSentToday,
      },
    };

  } finally {
    await prisma.$disconnect();
  }
}

// Display database statistics
function displayStats(stats: DatabaseStats): void {
  console.log('📊 HelpSavta Database Monitor');
  console.log('============================');
  console.log(`🕒 Timestamp: ${new Date().toISOString()}`);
  console.log(`🔒 Environment: ${environment.NODE_ENV}`);
  console.log(`💾 Database: ${environment.isProduction ? 'PostgreSQL' : 'SQLite'}`);
  console.log('');

  // Connection Status
  console.log('🔌 Connection Status');
  console.log('-------------------');
  console.log(`Status: ${stats.connectionStatus ? '✅ Connected' : '❌ Disconnected'}`);
  console.log(`Response Time: ${stats.performance.avgResponseTime}ms`);
  console.log(`Active Connections: ${stats.performance.activeConnections}`);
  console.log(`Database Size: ${stats.performance.databaseSize}`);
  console.log('');

  // Record Counts
  console.log('📈 Record Counts');
  console.log('---------------');
  console.log(`Tech Requests: ${stats.recordCounts.techRequests.toLocaleString()}`);
  console.log(`Available Slots: ${stats.recordCounts.availableSlots.toLocaleString()}`);
  console.log(`Admin Users: ${stats.recordCounts.adminUsers.toLocaleString()}`);
  console.log(`Notification Logs: ${stats.recordCounts.notificationLogs.toLocaleString()}`);
  console.log('');

  // Recent Activity
  console.log('🔥 Recent Activity');
  console.log('-----------------');
  console.log(`Requests (Last Hour): ${stats.recentActivity.requestsLastHour}`);
  console.log(`Slots Created (Today): ${stats.recentActivity.slotsCreatedToday}`);
  console.log(`Notifications (Today): ${stats.recentActivity.notificationsSentToday}`);
  console.log('');

  // Index Usage (PostgreSQL only)
  if (stats.indexUsage.length > 0) {
    console.log('🔍 Top Index Usage');
    console.log('-----------------');
    stats.indexUsage.slice(0, 5).forEach((index, i) => {
      console.log(`${i + 1}. ${index.tableName}.${index.indexName}`);
      console.log(`   Scans: ${index.scans.toLocaleString()}, Tuples Read: ${index.tuplesRead.toLocaleString()}`);
    });
    console.log('');
  }
}

// Generate health report
async function generateHealthReport(): Promise<void> {
  try {
    console.log('🏥 Generating Database Health Report...');
    console.log('');

    const stats = await getDatabaseStats();
    displayStats(stats);

    // Health assessment
    console.log('🏥 Health Assessment');
    console.log('-------------------');
    
    const issues: string[] = [];
    const warnings: string[] = [];

    // Check connection
    if (!stats.connectionStatus) {
      issues.push('Database connection failed');
    }

    // Check response time
    if (stats.performance.avgResponseTime > 1000) {
      warnings.push(`High response time: ${stats.performance.avgResponseTime}ms`);
    }

    // Check data growth
    if (stats.recentActivity.requestsLastHour > 100) {
      warnings.push(`High request volume: ${stats.recentActivity.requestsLastHour} requests/hour`);
    }

    // Check active connections (PostgreSQL)
    if (stats.performance.activeConnections > 15) {
      warnings.push(`High connection count: ${stats.performance.activeConnections}`);
    }

    // Display results
    if (issues.length === 0 && warnings.length === 0) {
      console.log('✅ All systems healthy');
    } else {
      if (issues.length > 0) {
        console.log('❌ Issues:');
        issues.forEach(issue => console.log(`   - ${issue}`));
      }
      if (warnings.length > 0) {
        console.log('⚠️  Warnings:');
        warnings.forEach(warning => console.log(`   - ${warning}`));
      }
    }

    console.log('');
    console.log('📊 Summary');
    console.log('----------');
    console.log(`Total Records: ${Object.values(stats.recordCounts).reduce((a, b) => a + b, 0).toLocaleString()}`);
    console.log(`System Status: ${stats.connectionStatus ? 'Operational' : 'Degraded'}`);
    console.log(`Performance: ${stats.performance.avgResponseTime < 500 ? 'Good' : stats.performance.avgResponseTime < 1000 ? 'Fair' : 'Poor'}`);

  } catch (error) {
    console.error('❌ Failed to generate health report:', error);
    process.exit(1);
  }
}

// Watch mode - continuous monitoring
async function watchMode(intervalSeconds: number = 30): Promise<void> {
  console.log(`🔄 Starting database monitoring (refresh every ${intervalSeconds}s)`);
  console.log('Press Ctrl+C to stop');
  console.log('');

  const refresh = async () => {
    try {
      // Clear screen
      process.stdout.write('\x1Bc');
      
      const stats = await getDatabaseStats();
      displayStats(stats);
      
      console.log(`⏰ Next update in ${intervalSeconds}s...`);
      
    } catch (error) {
      console.error('❌ Monitoring error:', error);
    }
  };

  // Initial display
  await refresh();

  // Set up interval
  const interval = setInterval(refresh, intervalSeconds * 1000);

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    clearInterval(interval);
    console.log('\n👋 Database monitoring stopped');
    process.exit(0);
  });
}

// Export PostgreSQL queries for external monitoring
function exportMonitoringQueries(): void {
  const queries = {
    connection_count: `
SELECT count(*) as active_connections
FROM pg_stat_activity 
WHERE datname = current_database();`,

    database_size: `
SELECT pg_size_pretty(pg_database_size(current_database())) as size;`,

    table_sizes: `
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;`,

    slow_queries: `
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    rows
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;`,

    index_usage: `
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes 
ORDER BY idx_scan DESC;`,

    locks: `
SELECT 
    waiting.locktype,
    waiting.relation::regclass,
    waiting.mode,
    waiting.pid as waiting_pid,
    blocking.pid as blocking_pid
FROM pg_catalog.pg_locks waiting
JOIN pg_catalog.pg_locks blocking ON (
    waiting.locktype = blocking.locktype 
    AND waiting.database = blocking.database 
    AND waiting.relation = blocking.relation
)
WHERE NOT waiting.granted 
    AND blocking.granted
    AND waiting.pid != blocking.pid;`
  };

  console.log('📋 PostgreSQL Monitoring Queries');
  console.log('=================================');
  console.log('');

  Object.entries(queries).forEach(([name, query]) => {
    console.log(`-- ${name.toUpperCase().replace('_', ' ')}`);
    console.log(query.trim());
    console.log('');
  });
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  try {
    switch (command) {
      case 'report':
        await generateHealthReport();
        break;

      case 'watch':
        const interval = parseInt(args[1]) || 30;
        await watchMode(interval);
        break;

      case 'queries':
        exportMonitoringQueries();
        break;

      case 'stats':
        const stats = await getDatabaseStats();
        console.log(JSON.stringify(stats, null, 2));
        break;

      default:
        console.log('📊 HelpSavta Database Monitor');
        console.log('============================');
        console.log('');
        console.log('Available commands:');
        console.log('  report    Generate health report');
        console.log('  watch [interval]    Watch mode (default: 30s)');
        console.log('  queries   Export monitoring queries');
        console.log('  stats     JSON stats output');
        console.log('');
        console.log('Examples:');
        console.log('  npm run db:monitor report');
        console.log('  npm run db:monitor watch 60');
        console.log('  npm run db:monitor queries');
        break;
    }

  } catch (error) {
    console.error('💥 Monitor command failed:', error);
    process.exit(1);
  }
}

// Run CLI if this file is executed directly
if (require.main === module) {
  main();
}

export {
  getDatabaseStats,
  generateHealthReport,
  watchMode,
  exportMonitoringQueries
};