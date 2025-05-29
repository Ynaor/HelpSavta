import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { environment } from '../src/config/environment';
import { createPrismaClient, checkDatabaseConnection, optimizeDatabase } from '../src/config/database.production';

const execAsync = promisify(exec);

interface SetupOptions {
  skipDependencies?: boolean;
  skipMigration?: boolean;
  skipOptimization?: boolean;
  environment?: 'staging' | 'production';
}

// Check system prerequisites
async function checkPrerequisites(): Promise<boolean> {
  console.log('🔍 Checking system prerequisites...');
  
  const checks = [
    { name: 'Node.js', command: 'node --version' },
    { name: 'npm', command: 'npm --version' },
    { name: 'PostgreSQL', command: 'psql --version' },
    { name: 'pg_dump', command: 'pg_dump --version' }
  ];

  let allPassed = true;

  for (const check of checks) {
    try {
      const { stdout } = await execAsync(check.command);
      console.log(`   ✅ ${check.name}: ${stdout.trim()}`);
    } catch (error) {
      console.log(`   ❌ ${check.name}: Not found or not accessible`);
      allPassed = false;
    }
  }

  return allPassed;
}

// Install dependencies
async function installDependencies(): Promise<boolean> {
  try {
    console.log('📦 Installing PostgreSQL dependencies...');
    
    const { stdout, stderr } = await execAsync('npm install', {
      cwd: path.join(__dirname, '..'),
      maxBuffer: 1024 * 1024 * 10 // 10MB buffer
    });

    if (stderr && !stderr.includes('warn')) {
      console.warn('⚠️  Installation warnings:', stderr);
    }

    console.log('✅ Dependencies installed successfully');
    return true;

  } catch (error) {
    console.error('❌ Failed to install dependencies:', error);
    return false;
  }
}

// Setup database schema
async function setupDatabaseSchema(): Promise<boolean> {
  try {
    console.log('🗄️  Setting up database schema...');
    
    // Generate Prisma client
    console.log('   📝 Generating Prisma client...');
    await execAsync('npx prisma generate', {
      cwd: path.join(__dirname, '..')
    });

    // Deploy migrations
    console.log('   🚀 Deploying migrations...');
    await execAsync('npx prisma migrate deploy', {
      cwd: path.join(__dirname, '..')
    });

    console.log('✅ Database schema setup completed');
    return true;

  } catch (error) {
    console.error('❌ Failed to setup database schema:', error);
    return false;
  }
}

// Verify environment configuration
function verifyEnvironmentConfig(): boolean {
  console.log('⚙️  Verifying environment configuration...');
  
  const requiredVars = [
    'DATABASE_URL',
    'SESSION_SECRET',
    'EMAIL_HOST',
    'EMAIL_USER',
    'EMAIL_PASS',
    'DEFAULT_ADMIN_USERNAME',
    'DEFAULT_ADMIN_PASSWORD'
  ];

  let allPresent = true;

  for (const varName of requiredVars) {
    const value = process.env[varName];
    if (!value) {
      console.log(`   ❌ Missing: ${varName}`);
      allPresent = false;
    } else if (varName.includes('SECRET') || varName.includes('PASSWORD')) {
      console.log(`   ✅ ${varName}: [HIDDEN]`);
    } else {
      console.log(`   ✅ ${varName}: ${value.substring(0, 20)}${value.length > 20 ? '...' : ''}`);
    }
  }

  return allPresent;
}

// Create production systemd service file
function createSystemdService(): void {
  const serviceContent = `[Unit]
Description=HelpSavta Backend Service
After=network.target postgresql.service redis.service

[Service]
Type=simple
User=helpsavta
WorkingDirectory=/opt/helpsavta/backend
Environment=NODE_ENV=production
EnvironmentFile=/opt/helpsavta/backend/.env.production
ExecStart=/usr/bin/npm start
Restart=on-failure
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=helpsavta-backend

# Security settings
NoNewPrivileges=yes
PrivateTmp=yes
ProtectSystem=strict
ProtectHome=yes
ReadWritePaths=/opt/helpsavta/backend/backups

[Install]
WantedBy=multi-user.target
`;

  const serviceDir = '/tmp';
  const servicePath = path.join(serviceDir, 'helpsavta-backend.service');
  
  try {
    fs.writeFileSync(servicePath, serviceContent);
    console.log(`✅ Systemd service file created: ${servicePath}`);
    console.log('   To install: sudo cp /tmp/helpsavta-backend.service /etc/systemd/system/');
    console.log('   To enable: sudo systemctl enable helpsavta-backend');
    console.log('   To start: sudo systemctl start helpsavta-backend');
  } catch (error) {
    console.error('❌ Failed to create systemd service file:', error);
  }
}

// Create nginx configuration
function createNginxConfig(): void {
  const nginxContent = `# HelpSavta Backend Nginx Configuration
server {
    listen 80;
    server_name your-api-domain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-api-domain.com;

    # SSL Configuration
    ssl_certificate /etc/ssl/certs/your-domain.crt;
    ssl_certificate_key /etc/ssl/private/your-domain.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;

    # Proxy to Node.js application
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check endpoint (no rate limiting)
    location /health {
        proxy_pass http://localhost:3001/health;
        access_log off;
    }

    # Static files (if any)
    location /static/ {
        alias /opt/helpsavta/backend/public/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Deny access to sensitive files
    location ~ /\\. {
        deny all;
    }

    location ~ \\.(env|log)$ {
        deny all;
    }
}
`;

  const configPath = '/tmp/helpsavta-backend.nginx.conf';
  
  try {
    fs.writeFileSync(configPath, nginxContent);
    console.log(`✅ Nginx configuration created: ${configPath}`);
    console.log('   To install: sudo cp /tmp/helpsavta-backend.nginx.conf /etc/nginx/sites-available/');
    console.log('   To enable: sudo ln -s /etc/nginx/sites-available/helpsavta-backend.nginx.conf /etc/nginx/sites-enabled/');
    console.log('   To test: sudo nginx -t');
    console.log('   To reload: sudo systemctl reload nginx');
  } catch (error) {
    console.error('❌ Failed to create nginx configuration:', error);
  }
}

// Setup database monitoring
async function setupDatabaseMonitoring(): Promise<void> {
  const prisma = createPrismaClient();
  
  try {
    console.log('📊 Setting up database monitoring...');

    // Create monitoring queries
    const monitoringQueries = `
-- Save this as monitor-queries.sql
-- Database size monitoring
SELECT 
    pg_size_pretty(pg_database_size(current_database())) as database_size,
    current_database() as database_name,
    now() as checked_at;

-- Table sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
    pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Active connections
SELECT 
    count(*) as active_connections,
    max(datname) as database_name
FROM pg_stat_activity 
WHERE datname = current_database();

-- Lock monitoring
SELECT 
    waiting.locktype,
    waiting.relation::regclass,
    waiting.mode,
    waiting.pid as waiting_pid,
    waiting.query as waiting_query,
    blocking.pid as blocking_pid,
    blocking.query as blocking_query
FROM pg_catalog.pg_locks waiting
JOIN pg_catalog.pg_stat_activity waiting_activity ON waiting.pid = waiting_activity.pid
JOIN pg_catalog.pg_locks blocking ON (waiting.locktype = blocking.locktype 
    AND waiting.database = blocking.database 
    AND waiting.relation = blocking.relation)
JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking.pid = blocking_activity.pid
WHERE NOT waiting.granted 
    AND blocking.granted
    AND waiting.pid != blocking.pid;

-- Index usage statistics
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_tup_read,
    idx_tup_fetch,
    idx_scan
FROM pg_stat_user_indexes 
ORDER BY idx_scan DESC;
`;

    const monitoringPath = path.join(__dirname, '../monitoring-queries.sql');
    fs.writeFileSync(monitoringPath, monitoringQueries);
    console.log(`✅ Database monitoring queries saved: ${monitoringPath}`);

  } catch (error) {
    console.error('❌ Failed to setup database monitoring:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Main production setup function
async function setupProduction(options: SetupOptions = {}): Promise<void> {
  console.log('🚀 Starting production setup for HelpSavta Backend...');
  console.log('================================================');

  try {
    // Check prerequisites
    const prerequisitesPassed = await checkPrerequisites();
    if (!prerequisitesPassed) {
      console.log('\n❌ Prerequisites check failed. Please install missing components.');
      return;
    }

    // Verify environment configuration
    const configValid = verifyEnvironmentConfig();
    if (!configValid) {
      console.log('\n❌ Environment configuration incomplete. Please check your .env.production file.');
      return;
    }

    // Install dependencies
    if (!options.skipDependencies) {
      const dependenciesInstalled = await installDependencies();
      if (!dependenciesInstalled) {
        throw new Error('Failed to install dependencies');
      }
    }

    // Setup database schema
    if (!options.skipMigration) {
      const schemaSetup = await setupDatabaseSchema();
      if (!schemaSetup) {
        throw new Error('Failed to setup database schema');
      }
    }

    // Optimize database
    if (!options.skipOptimization) {
      console.log('⚡ Optimizing database...');
      const prisma = createPrismaClient();
      try {
        await optimizeDatabase(prisma);
        console.log('✅ Database optimization completed');
      } finally {
        await prisma.$disconnect();
      }
    }

    // Create system configuration files
    console.log('⚙️  Creating system configuration files...');
    createSystemdService();
    createNginxConfig();

    // Setup monitoring
    await setupDatabaseMonitoring();

    console.log('\n🎉 Production setup completed successfully!');
    console.log('================================================');
    console.log('📝 Next steps:');
    console.log('   1. Review and install systemd service file');
    console.log('   2. Configure and install nginx configuration');
    console.log('   3. Setup SSL certificates');
    console.log('   4. Configure firewall rules');
    console.log('   5. Setup log rotation');
    console.log('   6. Configure monitoring and alerting');
    console.log('   7. Test the application thoroughly');

  } catch (error) {
    console.error('\n💥 Production setup failed:', error);
    process.exit(1);
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  const options: SetupOptions = {
    skipDependencies: args.includes('--skip-dependencies'),
    skipMigration: args.includes('--skip-migration'),
    skipOptimization: args.includes('--skip-optimization')
  };

  try {
    switch (command) {
      case 'setup':
        await setupProduction(options);
        break;

      case 'check':
        await checkPrerequisites();
        verifyEnvironmentConfig();
        break;

      case 'systemd':
        createSystemdService();
        break;

      case 'nginx':
        createNginxConfig();
        break;

      case 'monitor':
        await setupDatabaseMonitoring();
        break;

      default:
        console.log('🛠️  HelpSavta Production Setup Tool');
        console.log('===================================');
        console.log('');
        console.log('Available commands:');
        console.log('  setup [--skip-dependencies] [--skip-migration] [--skip-optimization]');
        console.log('    Complete production setup');
        console.log('');
        console.log('  check');
        console.log('    Check prerequisites and configuration');
        console.log('');
        console.log('  systemd');
        console.log('    Generate systemd service file');
        console.log('');
        console.log('  nginx');
        console.log('    Generate nginx configuration');
        console.log('');
        console.log('  monitor');
        console.log('    Setup database monitoring queries');
        console.log('');
        console.log('Examples:');
        console.log('  npm run production:setup');
        console.log('  npm run production:setup check');
        console.log('  npm run production:setup systemd');
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

export {
  setupProduction,
  checkPrerequisites,
  installDependencies,
  setupDatabaseSchema,
  verifyEnvironmentConfig
};