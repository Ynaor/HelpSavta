import { PrismaClient } from '@prisma/client';
import { createPrismaClient, checkDatabaseConnection, optimizeDatabase } from '../src/config/database.production';
import fs from 'fs';
import path from 'path';

// SQLite Prisma Client (source)
const sqlitePrisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:./dev.db'
    }
  }
});

// PostgreSQL Prisma Client (destination)
const postgresqlPrisma = createPrismaClient();

interface MigrationStats {
  techRequests: number;
  availableSlots: number;
  adminUsers: number;
  notificationLogs: number;
  errors: string[];
}

// Backup SQLite data to JSON files
async function backupSQLiteData(): Promise<boolean> {
  try {
    console.log('🔄 Starting SQLite data backup...');
    
    const backupDir = path.join(__dirname, '../backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `sqlite-backup-${timestamp}`);
    
    if (!fs.existsSync(backupPath)) {
      fs.mkdirSync(backupPath, { recursive: true });
    }

    // Backup all tables
    const [techRequests, availableSlots, adminUsers, notificationLogs] = await Promise.all([
      sqlitePrisma.techRequest.findMany(),
      sqlitePrisma.availableSlot.findMany(),
      sqlitePrisma.adminUser.findMany(),
      sqlitePrisma.notificationLog.findMany(),
    ]);

    // Write to JSON files
    fs.writeFileSync(
      path.join(backupPath, 'tech_requests.json'),
      JSON.stringify(techRequests, null, 2)
    );
    fs.writeFileSync(
      path.join(backupPath, 'available_slots.json'),
      JSON.stringify(availableSlots, null, 2)
    );
    fs.writeFileSync(
      path.join(backupPath, 'admin_users.json'),
      JSON.stringify(adminUsers, null, 2)
    );
    fs.writeFileSync(
      path.join(backupPath, 'notification_logs.json'),
      JSON.stringify(notificationLogs, null, 2)
    );

    console.log(`✅ SQLite data backed up to: ${backupPath}`);
    console.log(`   - Tech Requests: ${techRequests.length}`);
    console.log(`   - Available Slots: ${availableSlots.length}`);
    console.log(`   - Admin Users: ${adminUsers.length}`);
    console.log(`   - Notification Logs: ${notificationLogs.length}`);

    return true;
  } catch (error) {
    console.error('❌ Failed to backup SQLite data:', error);
    return false;
  }
}

// Migrate data from SQLite to PostgreSQL
async function migrateData(): Promise<MigrationStats> {
  const stats: MigrationStats = {
    techRequests: 0,
    availableSlots: 0,
    adminUsers: 0,
    notificationLogs: 0,
    errors: []
  };

  try {
    console.log('🔄 Starting data migration...');

    // Check PostgreSQL connection
    const isConnected = await checkDatabaseConnection(postgresqlPrisma);
    if (!isConnected) {
      throw new Error('Cannot connect to PostgreSQL database');
    }

    // Clear existing data in PostgreSQL (in correct order due to foreign keys)
    console.log('🧹 Clearing existing PostgreSQL data...');
    await postgresqlPrisma.techRequest.deleteMany();
    await postgresqlPrisma.availableSlot.deleteMany();
    await postgresqlPrisma.adminUser.deleteMany();
    await postgresqlPrisma.notificationLog.deleteMany();

    // Reset sequences
    await postgresqlPrisma.$executeRaw`ALTER SEQUENCE tech_requests_id_seq RESTART WITH 1;`;
    await postgresqlPrisma.$executeRaw`ALTER SEQUENCE available_slots_id_seq RESTART WITH 1;`;
    await postgresqlPrisma.$executeRaw`ALTER SEQUENCE admin_users_id_seq RESTART WITH 1;`;
    await postgresqlPrisma.$executeRaw`ALTER SEQUENCE notification_logs_id_seq RESTART WITH 1;`;

    // Migrate Admin Users first (no dependencies)
    console.log('👥 Migrating admin users...');
    const adminUsers = await sqlitePrisma.adminUser.findMany({
      orderBy: { id: 'asc' }
    });

    for (const user of adminUsers) {
      try {
        await postgresqlPrisma.adminUser.create({
          data: {
            username: user.username,
            password_hash: user.password_hash,
            role: user.role,
            created_by_id: user.created_by_id,
            is_active: user.is_active,
            created_at: user.created_at,
            updated_at: user.updated_at,
          }
        });
        stats.adminUsers++;
      } catch (error) {
        const errorMsg = `Failed to migrate admin user ${user.id}: ${error}`;
        console.error(errorMsg);
        stats.errors.push(errorMsg);
      }
    }

    // Migrate Available Slots (no dependencies)
    console.log('📅 Migrating available slots...');
    const availableSlots = await sqlitePrisma.availableSlot.findMany({
      orderBy: { id: 'asc' }
    });

    for (const slot of availableSlots) {
      try {
        await postgresqlPrisma.availableSlot.create({
          data: {
            date: slot.date,
            start_time: slot.start_time,
            end_time: slot.end_time,
            is_booked: slot.is_booked,
            created_at: slot.created_at,
            updated_at: slot.updated_at,
          }
        });
        stats.availableSlots++;
      } catch (error) {
        const errorMsg = `Failed to migrate available slot ${slot.id}: ${error}`;
        console.error(errorMsg);
        stats.errors.push(errorMsg);
      }
    }

    // Migrate Tech Requests (depends on admin users and available slots)
    console.log('🎫 Migrating tech requests...');
    const techRequests = await sqlitePrisma.techRequest.findMany({
      orderBy: { id: 'asc' }
    });

    for (const request of techRequests) {
      try {
        await postgresqlPrisma.techRequest.create({
          data: {
            full_name: request.full_name,
            phone: request.phone,
            email: request.email,
            address: request.address,
            problem_description: request.problem_description,
            urgency_level: request.urgency_level,
            scheduled_date: request.scheduled_date,
            scheduled_time: request.scheduled_time,
            status: request.status,
            notes: request.notes,
            assigned_admin_id: request.assigned_admin_id,
            booked_slot_id: request.booked_slot_id,
            created_at: request.created_at,
            updated_at: request.updated_at,
          }
        });
        stats.techRequests++;
      } catch (error) {
        const errorMsg = `Failed to migrate tech request ${request.id}: ${error}`;
        console.error(errorMsg);
        stats.errors.push(errorMsg);
      }
    }

    // Migrate Notification Logs (no dependencies)
    console.log('📧 Migrating notification logs...');
    const notificationLogs = await sqlitePrisma.notificationLog.findMany({
      orderBy: { id: 'asc' }
    });

    for (const log of notificationLogs) {
      try {
        await postgresqlPrisma.notificationLog.create({
          data: {
            type: log.type,
            recipient: log.recipient,
            message: log.message,
            sent_at: log.sent_at,
            status: log.status,
          }
        });
        stats.notificationLogs++;
      } catch (error) {
        const errorMsg = `Failed to migrate notification log ${log.id}: ${error}`;
        console.error(errorMsg);
        stats.errors.push(errorMsg);
      }
    }

    console.log('✅ Data migration completed!');

  } catch (error) {
    const errorMsg = `Migration failed: ${error}`;
    console.error(errorMsg);
    stats.errors.push(errorMsg);
  }

  return stats;
}

// Verify migration integrity
async function verifyMigration(): Promise<boolean> {
  try {
    console.log('🔍 Verifying migration integrity...');

    const [
      sqliteStats,
      postgresStats
    ] = await Promise.all([
      // SQLite counts
      Promise.all([
        sqlitePrisma.techRequest.count(),
        sqlitePrisma.availableSlot.count(),
        sqlitePrisma.adminUser.count(),
        sqlitePrisma.notificationLog.count(),
      ]),
      // PostgreSQL counts
      Promise.all([
        postgresqlPrisma.techRequest.count(),
        postgresqlPrisma.availableSlot.count(),
        postgresqlPrisma.adminUser.count(),
        postgresqlPrisma.notificationLog.count(),
      ])
    ]);

    const [sqliteTech, sqliteSlots, sqliteAdmins, sqliteNotifications] = sqliteStats;
    const [postgresTech, postgresSlots, postgresAdmins, postgresNotifications] = postgresStats;

    console.log('📊 Migration Verification:');
    console.log(`   Tech Requests: SQLite(${sqliteTech}) → PostgreSQL(${postgresTech}) ${sqliteTech === postgresTech ? '✅' : '❌'}`);
    console.log(`   Available Slots: SQLite(${sqliteSlots}) → PostgreSQL(${postgresSlots}) ${sqliteSlots === postgresSlots ? '✅' : '❌'}`);
    console.log(`   Admin Users: SQLite(${sqliteAdmins}) → PostgreSQL(${postgresAdmins}) ${sqliteAdmins === postgresAdmins ? '✅' : '❌'}`);
    console.log(`   Notification Logs: SQLite(${sqliteNotifications}) → PostgreSQL(${postgresNotifications}) ${sqliteNotifications === postgresNotifications ? '✅' : '❌'}`);

    const isValid = sqliteTech === postgresTech && 
                   sqliteSlots === postgresSlots && 
                   sqliteAdmins === postgresAdmins && 
                   sqliteNotifications === postgresNotifications;

    if (isValid) {
      console.log('✅ Migration verification passed!');
    } else {
      console.log('❌ Migration verification failed!');
    }

    return isValid;

  } catch (error) {
    console.error('❌ Verification failed:', error);
    return false;
  }
}

// Main migration function
async function main() {
  console.log('🚀 Starting SQLite to PostgreSQL migration...');
  console.log('================================================');

  try {
    // Step 1: Backup SQLite data
    const backupSuccess = await backupSQLiteData();
    if (!backupSuccess) {
      throw new Error('Backup failed - aborting migration');
    }

    // Step 2: Migrate data
    const stats = await migrateData();

    // Step 3: Optimize PostgreSQL database
    console.log('⚡ Optimizing PostgreSQL database...');
    await optimizeDatabase(postgresqlPrisma);

    // Step 4: Verify migration
    const verificationPassed = await verifyMigration();

    // Step 5: Print summary
    console.log('\n📋 Migration Summary:');
    console.log('================================================');
    console.log(`✅ Tech Requests migrated: ${stats.techRequests}`);
    console.log(`✅ Available Slots migrated: ${stats.availableSlots}`);
    console.log(`✅ Admin Users migrated: ${stats.adminUsers}`);
    console.log(`✅ Notification Logs migrated: ${stats.notificationLogs}`);
    
    if (stats.errors.length > 0) {
      console.log(`\n❌ Errors encountered: ${stats.errors.length}`);
      stats.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }

    console.log(`\n🔍 Verification: ${verificationPassed ? 'PASSED ✅' : 'FAILED ❌'}`);

    if (verificationPassed && stats.errors.length === 0) {
      console.log('\n🎉 Migration completed successfully!');
      console.log('📝 Next steps:');
      console.log('   1. Update your environment variables to use PostgreSQL');
      console.log('   2. Run: npm run db:generate');
      console.log('   3. Test the application thoroughly');
      console.log('   4. Keep SQLite backup files for safety');
    } else {
      console.log('\n⚠️  Migration completed with issues. Please review errors and verify data integrity.');
    }

  } catch (error) {
    console.error('\n💥 Migration failed:', error);
    process.exit(1);
  } finally {
    // Close connections
    await sqlitePrisma.$disconnect();
    await postgresqlPrisma.$disconnect();
  }
}

// Run migration
if (require.main === module) {
  main().catch((error) => {
    console.error('Migration script failed:', error);
    process.exit(1);
  });
}

export { main as runMigration };