"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBackup = createBackup;
exports.restoreBackup = restoreBackup;
exports.listBackups = listBackups;
exports.cleanOldBackups = cleanOldBackups;
const child_process_1 = require("child_process");
const util_1 = require("util");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const database_production_1 = require("../src/config/database.production");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
async function createBackup(options = {}) {
    const { outputPath, compress = true, includeData = true, includeSchema = true } = options;
    const config = (0, database_production_1.getBackupConfig)();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path_1.default.join(__dirname, '../backups');
    if (!fs_1.default.existsSync(backupDir)) {
        fs_1.default.mkdirSync(backupDir, { recursive: true });
    }
    const fileName = `postgresql-backup-${timestamp}.sql${compress ? '.gz' : ''}`;
    const fullPath = outputPath || path_1.default.join(backupDir, fileName);
    try {
        console.log('🔄 Creating PostgreSQL backup...');
        let command = `pg_dump -h ${config.host} -p ${config.port} -U ${config.username} -d ${config.database}`;
        const options = [
            '--no-password',
            '--clean',
            '--if-exists',
            '--create',
            '--verbose'
        ];
        if (!includeData) {
            options.push('--schema-only');
        }
        else if (!includeSchema) {
            options.push('--data-only');
        }
        command += ' ' + options.join(' ');
        if (compress) {
            command += ' | gzip';
        }
        command += ` > "${fullPath}"`;
        const env = { ...process.env, PGPASSWORD: config.password };
        console.log(`📁 Backup path: ${fullPath}`);
        console.log('⏳ Running backup command...');
        const { stdout, stderr } = await execAsync(command, {
            env,
            maxBuffer: 1024 * 1024 * 100
        });
        if (stderr && !stderr.includes('NOTICE')) {
            console.warn('⚠️  Backup warnings:', stderr);
        }
        const stats = fs_1.default.statSync(fullPath);
        if (stats.size === 0) {
            throw new Error('Backup file is empty');
        }
        console.log(`✅ Backup created successfully: ${fullPath}`);
        console.log(`📊 Backup size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
        return fullPath;
    }
    catch (error) {
        console.error('❌ Backup failed:', error);
        throw error;
    }
}
async function restoreBackup(options) {
    const { backupPath, dropExisting = false, dataOnly = false, schemaOnly = false } = options;
    const config = (0, database_production_1.getBackupConfig)();
    try {
        console.log('🔄 Restoring PostgreSQL backup...');
        console.log(`📁 Backup file: ${backupPath}`);
        if (!fs_1.default.existsSync(backupPath)) {
            throw new Error(`Backup file not found: ${backupPath}`);
        }
        const isCompressed = backupPath.endsWith('.gz');
        let command = '';
        if (isCompressed) {
            command = `gunzip -c "${backupPath}" | `;
        }
        else {
            command = `cat "${backupPath}" | `;
        }
        command += `psql -h ${config.host} -p ${config.port} -U ${config.username} -d ${config.database}`;
        const options = ['--no-password'];
        if (dataOnly) {
            console.log('⚠️  Data-only restore: Make sure schema already exists');
        }
        if (schemaOnly) {
            console.log('⚠️  Schema-only restore: This will only restore structure');
        }
        command += ' ' + options.join(' ');
        const env = { ...process.env, PGPASSWORD: config.password };
        console.log('⏳ Running restore command...');
        const { stdout, stderr } = await execAsync(command, {
            env,
            maxBuffer: 1024 * 1024 * 100
        });
        if (stderr && !stderr.includes('NOTICE')) {
            console.warn('⚠️  Restore warnings:', stderr);
        }
        console.log('✅ Database restored successfully');
    }
    catch (error) {
        console.error('❌ Restore failed:', error);
        throw error;
    }
}
function listBackups() {
    const backupDir = path_1.default.join(__dirname, '../backups');
    if (!fs_1.default.existsSync(backupDir)) {
        return [];
    }
    const files = fs_1.default.readdirSync(backupDir)
        .filter(file => file.startsWith('postgresql-backup-') && (file.endsWith('.sql') || file.endsWith('.sql.gz')))
        .map(file => {
        const fullPath = path_1.default.join(backupDir, file);
        const stats = fs_1.default.statSync(fullPath);
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
function cleanOldBackups(keepCount = 5) {
    const backupDir = path_1.default.join(__dirname, '../backups');
    if (!fs_1.default.existsSync(backupDir)) {
        return;
    }
    const files = fs_1.default.readdirSync(backupDir)
        .filter(file => file.startsWith('postgresql-backup-') && (file.endsWith('.sql') || file.endsWith('.sql.gz')))
        .map(file => ({
        name: file,
        path: path_1.default.join(backupDir, file),
        created: fs_1.default.statSync(path_1.default.join(backupDir, file)).birthtime
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
            fs_1.default.unlinkSync(file.path);
            console.log(`   ✅ Deleted: ${file.name}`);
        }
        catch (error) {
            console.error(`   ❌ Failed to delete ${file.name}:`, error);
        }
    });
}
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
    }
    catch (error) {
        console.error('💥 Command failed:', error);
        process.exit(1);
    }
}
if (require.main === module) {
    main();
}
//# sourceMappingURL=backup-restore.js.map