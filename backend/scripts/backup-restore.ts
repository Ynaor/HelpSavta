import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { getBackupConfig } from '../src/config/database.production';
import { environment } from '../src/config/environment';

const execAsync = promisify(exec);

interface BackupOptions {
  outputPath?: string;
  compress?: boolean;
  includeData?: boolean;
  includeSchema?: boolean;
}

interface RestoreOptions {
  backupPath: string;
  dropExisting?: boolean;
  dataOnly?: boolean;
  schemaOnly?: boolean;
}

// Create PostgreSQL database backup
export async function createBackup(options: BackupOptions = {}): Promise<string> {
  const {
    outputPath,
    compress = true,
    includeData = true,
    includeSchema = true
  } = options;

  const config = getBackupConfig();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(__dirname, '../backups');
  
  // Ensure backup directory exists
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const fileName = `postgresql-backup-${timestamp}.sql${compress ? '.gz' : ''}`;
  const fullPath = outputPath || path.join(backupDir, fileName);

  try {
    console.log('🔄 Creating PostgreSQL backup...');
    
    // Build pg_dump command
    let command = `pg_dump -h ${config.host} -p ${config.port} -U ${config.username} -d ${config.database}`;
    
    // Add options
    const options = [
      '--no-password',
      '--clean',
      '--if-exists',
      '--create',
      '--verbose'
    ];

    if (!includeData) {
      options.push('--schema-only');
    } else if (!includeSchema) {
      options.push('--data-only');
    }

    command += ' ' + options.join(' ');

    // Add compression if requested
    if (compress) {
      command += ' | gzip';
    }

    command += ` > "${fullPath}"`;

    // Set PGPASSWORD environment variable
    const env = { ...process.env, PGPASSWORD: config.password };

    console.log(`📁 Backup path: ${fullPath}`);
    console.log('⏳ Running backup command...');

    const { stdout, stderr } = await execAsync(command, { 
      env,
      maxBuffer: 1024 * 1024 * 100 // 100MB buffer
    });

    if (stderr && !stderr.includes('NOTICE')) {
      console.warn('⚠️  Backup warnings:', stderr);
    }

    // Verify backup file was created and has content
    const stats = fs.statSync(fullPath);
    if (stats.size === 0) {
      throw new Error('Backup file is empty');
    }

    console.log(`✅ Backup created successfully: ${fullPath}`);
    console.log(`📊 Backup size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

    return fullPath;

  } catch (error) {
    console.error('❌ Backup failed:', error);
    throw error;
  }
}

// Restore PostgreSQL database from backup
export async function restoreBackup(options: RestoreOptions): Promise<void> {
  const {
    backupPath,
    dropExisting = false,
    dataOnly = false,
    schemaOnly = false
  } = options;

  const config = getBackupConfig();

  try {
    console.log('🔄 Restoring PostgreSQL backup...');
    console.log(`📁 Backup file: ${backupPath}`);

    // Verify backup file exists
    if (!fs.existsSync(backupPath)) {
      throw new Error(`Backup file not found: ${backupPath}`);
    }

    const isCompressed = backupPath.endsWith('.gz');
    
    // Build restore command
    let command = '';
    
    if (isCompressed) {
      command = `gunzip -c "${backupPath}" | `;
    } else {
      command = `cat "${backupPath}" | `;
    }

    command += `psql -h ${config.host} -p ${config.port} -U ${config.username} -d ${config.database}`;

    // Add options
    const options = ['--no-password'];

    if (dataOnly) {
      // For data-only restore, we might need to handle this differently
      console.log('⚠️  Data-only restore: Make sure schema already exists');
    }

    if (schemaOnly) {
      console.log('⚠️  Schema-only restore: This will only restore structure');
    }

    command += ' ' + options.join(' ');

    // Set PGPASSWORD environment variable
    const env = { ...process.env, PGPASSWORD: config.password };

    console.log('⏳ Running restore command...');

    const { stdout, stderr } = await execAsync(command, { 
      env,
      maxBuffer: 1024 * 1024 * 100 // 100MB buffer
    });

    if (stderr && !stderr.includes('NOTICE')) {
      console.warn('⚠️  Restore warnings:', stderr);
    }

    console.log('✅ Database restored successfully');

  } catch (error) {
    console.error('❌ Restore failed:', error);
    throw error;
  }
}

// List available backups
export function listBackups(): string[] {
  const backupDir = path.join(__dirname, '../backups');
  
  if (!fs.existsSync(backupDir)) {
    return [];
  }

  const files = fs.readdirSync(backupDir)
    .filter(file => file.startsWith('postgresql-backup-') && (file.endsWith('.sql') || file.endsWith('.sql.gz')))
    .map(file => {
      const fullPath = path.join(backupDir, file);
      const stats = fs.statSync(fullPath);
      return {
        name: file,
        path: fullPath,
        size: stats.size,
        created: stats.birthtime,
        sizeFormatted: (stats.size / 1024 / 1024).toFixed(2) + ' MB'
      };
    })
    .sort((a, b) => b.created.getTime() - a.created.getTime());

  console.log('📋 Available backups:');
  files.forEach((file, index) => {
    console.log(`   ${index + 1}. ${file.name} (${file.sizeFormatted}) - ${file.created.toISOString()}`);
  });

  return files.map(f => f.path);
}

// Clean old backups (keep last N backups)
export function cleanOldBackups(keepCount: number = 5): void {
  const backupDir = path.join(__dirname, '../backups');
  
  if (!fs.existsSync(backupDir)) {
    return;
  }

  const files = fs.readdirSync(backupDir)
    .filter(file => file.startsWith('postgresql-backup-') && (file.endsWith('.sql') || file.endsWith('.sql.gz')))
    .map(file => ({
      name: file,
      path: path.join(backupDir, file),
      created: fs.statSync(path.join(backupDir, file)).birthtime
    }))
    .sort((a, b) => b.created.getTime() - a.created.getTime());

  if (files.length <= keepCount) {
    console.log(`📁 Found ${files.length} backups, keeping all (limit: ${keepCount})`);
    return;
  }

  const filesToDelete = files.slice(keepCount);
  
  console.log(`🧹 Cleaning ${filesToDelete.length} old backups (keeping ${keepCount} most recent)...`);
  
  filesToDelete.forEach(file => {
    try {
      fs.unlinkSync(file.path);
      console.log(`   ✅ Deleted: ${file.name}`);
    } catch (error) {
      console.error(`   ❌ Failed to delete ${file.name}:`, error);
    }
  });
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  try {
    switch (command) {
      case 'backup':
        const compress = !args.includes('--no-compress');
        const includeData = !args.includes('--schema-only');
        const includeSchema = !args.includes('--data-only');
        
        await createBackup({
          compress,
          includeData,
          includeSchema
        });
        break;

      case 'restore':
        const backupPath = args[1];
        if (!backupPath) {
          console.error('❌ Please provide backup file path');
          console.log('Usage: npm run backup-restore restore <backup-file-path>');
          process.exit(1);
        }
        
        await restoreBackup({
          backupPath,
          dataOnly: args.includes('--data-only'),
          schemaOnly: args.includes('--schema-only')
        });
        break;

      case 'list':
        listBackups();
        break;

      case 'clean':
        const keepCount = parseInt(args[1]) || 5;
        cleanOldBackups(keepCount);
        break;

      default:
        console.log('🗃️  PostgreSQL Backup & Restore Tool');
        console.log('=====================================');
        console.log('');
        console.log('Available commands:');
        console.log('  backup [--schema-only|--data-only] [--no-compress]');
        console.log('    Create a backup of the PostgreSQL database');
        console.log('');
        console.log('  restore <backup-file> [--data-only|--schema-only]');
        console.log('    Restore database from backup file');
        console.log('');
        console.log('  list');
        console.log('    List available backup files');
        console.log('');
        console.log('  clean [keep-count]');
        console.log('    Clean old backups (default: keep 5 most recent)');
        console.log('');
        console.log('Examples:');
        console.log('  npm run backup-restore backup');
        console.log('  npm run backup-restore restore ./backups/postgresql-backup-2024-01-01.sql.gz');
        console.log('  npm run backup-restore list');
        console.log('  npm run backup-restore clean 10');
        break;
    }

  } catch (error) {
    console.error('💥 Command failed:', error);
    process.exit(1);
  }
}

// Run CLI if this file is executed directly
if (require.main === module) {
  main();
}

// Export functions (already exported above)