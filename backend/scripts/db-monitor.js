"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDatabaseStats = getDatabaseStats;
exports.generateHealthReport = generateHealthReport;
exports.watchMode = watchMode;
exports.exportMonitoringQueries = exportMonitoringQueries;
const database_production_1 = require("../src/config/database.production");
const environment_1 = require("../src/config/environment");
async function getDatabaseStats() {
    const prisma = (0, database_production_1.createPrismaClient)();
    try {
        const startTime = Date.now();
        const connectionStatus = await (0, database_production_1.checkDatabaseConnection)(prisma);
        const [techRequests, availableSlots, adminUsers, notificationLogs] = await Promise.all([
            prisma.techRequest.count(),
            prisma.availableSlot.count(),
            prisma.adminUser.count(),
            prisma.notificationLog.count(),
        ]);
        const responseTime = Date.now() - startTime;
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
        let activeConnections = 0;
        let databaseSize = 'N/A';
        let indexUsage = [];
        if (environment_1.environment.isProduction || environment_1.environment.isStaging) {
            try {
                const connectionResult = await prisma.$queryRaw `
          SELECT count(*) as count 
          FROM pg_stat_activity 
          WHERE datname = current_database()
        `;
                activeConnections = connectionResult[0]?.count || 0;
                const sizeResult = await prisma.$queryRaw `
          SELECT pg_size_pretty(pg_database_size(current_database())) as size
        `;
                databaseSize = sizeResult[0]?.size || 'N/A';
                indexUsage = await prisma.$queryRaw `
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
        `;
            }
            catch (error) {
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
            indexUsage: indexUsage.map((row) => ({
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
    }
    finally {
        await prisma.$disconnect();
    }
}
function displayStats(stats) {
    console.log('📊 HelpSavta Database Monitor');
    console.log('============================');
    console.log(`🕒 Timestamp: ${new Date().toISOString()}`);
    console.log(`🔒 Environment: ${environment_1.environment.NODE_ENV}`);
    console.log(`💾 Database: ${environment_1.environment.isProduction ? 'PostgreSQL' : 'SQLite'}`);
    console.log('');
    console.log('🔌 Connection Status');
    console.log('-------------------');
    console.log(`Status: ${stats.connectionStatus ? '✅ Connected' : '❌ Disconnected'}`);
    console.log(`Response Time: ${stats.performance.avgResponseTime}ms`);
    console.log(`Active Connections: ${stats.performance.activeConnections}`);
    console.log(`Database Size: ${stats.performance.databaseSize}`);
    console.log('');
    console.log('📈 Record Counts');
    console.log('---------------');
    console.log(`Tech Requests: ${stats.recordCounts.techRequests.toLocaleString()}`);
    console.log(`Available Slots: ${stats.recordCounts.availableSlots.toLocaleString()}`);
    console.log(`Admin Users: ${stats.recordCounts.adminUsers.toLocaleString()}`);
    console.log(`Notification Logs: ${stats.recordCounts.notificationLogs.toLocaleString()}`);
    console.log('');
    console.log('🔥 Recent Activity');
    console.log('-----------------');
    console.log(`Requests (Last Hour): ${stats.recentActivity.requestsLastHour}`);
    console.log(`Slots Created (Today): ${stats.recentActivity.slotsCreatedToday}`);
    console.log(`Notifications (Today): ${stats.recentActivity.notificationsSentToday}`);
    console.log('');
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
async function generateHealthReport() {
    try {
        console.log('🏥 Generating Database Health Report...');
        console.log('');
        const stats = await getDatabaseStats();
        displayStats(stats);
        console.log('🏥 Health Assessment');
        console.log('-------------------');
        const issues = [];
        const warnings = [];
        if (!stats.connectionStatus) {
            issues.push('Database connection failed');
        }
        if (stats.performance.avgResponseTime > 1000) {
            warnings.push(`High response time: ${stats.performance.avgResponseTime}ms`);
        }
        if (stats.recentActivity.requestsLastHour > 100) {
            warnings.push(`High request volume: ${stats.recentActivity.requestsLastHour} requests/hour`);
        }
        if (stats.performance.activeConnections > 15) {
            warnings.push(`High connection count: ${stats.performance.activeConnections}`);
        }
        if (issues.length === 0 && warnings.length === 0) {
            console.log('✅ All systems healthy');
        }
        else {
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
    }
    catch (error) {
        console.error('❌ Failed to generate health report:', error);
        process.exit(1);
    }
}
async function watchMode(intervalSeconds = 30) {
    console.log(`🔄 Starting database monitoring (refresh every ${intervalSeconds}s)`);
    console.log('Press Ctrl+C to stop');
    console.log('');
    const refresh = async () => {
        try {
            process.stdout.write('\x1Bc');
            const stats = await getDatabaseStats();
            displayStats(stats);
            console.log(`⏰ Next update in ${intervalSeconds}s...`);
        }
        catch (error) {
            console.error('❌ Monitoring error:', error);
        }
    };
    await refresh();
    const interval = setInterval(refresh, intervalSeconds * 1000);
    process.on('SIGINT', () => {
        clearInterval(interval);
        console.log('\n👋 Database monitoring stopped');
        process.exit(0);
    });
}
function exportMonitoringQueries() {
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
    }
    catch (error) {
        console.error('💥 Monitor command failed:', error);
        process.exit(1);
    }
}
if (require.main === module) {
    main();
}
//# sourceMappingURL=db-monitor.js.map