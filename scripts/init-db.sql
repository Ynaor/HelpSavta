-- Database initialization script for HelpSavta
-- This script sets up the initial database configuration for development

-- Create the main database if it doesn't exist
-- (Note: In Docker, this is already handled by POSTGRES_DB environment variable)

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Create a read-only user for monitoring/reporting
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'helpsavta_readonly') THEN
        CREATE ROLE helpsavta_readonly WITH LOGIN PASSWORD 'readonly_password';
    END IF;
END
$$;

-- Grant necessary permissions to readonly user
GRANT CONNECT ON DATABASE helpsavta TO helpsavta_readonly;
GRANT USAGE ON SCHEMA public TO helpsavta_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO helpsavta_readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO helpsavta_readonly;

-- Create a backup user
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'helpsavta_backup') THEN
        CREATE ROLE helpsavta_backup WITH LOGIN PASSWORD 'backup_password';
    END IF;
END
$$;

-- Grant necessary permissions to backup user
GRANT CONNECT ON DATABASE helpsavta TO helpsavta_backup;
GRANT USAGE ON SCHEMA public TO helpsavta_backup;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO helpsavta_backup;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO helpsavta_backup;

-- Set up some database configuration for better performance
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET log_statement = 'mod';
ALTER SYSTEM SET log_min_duration_statement = 1000;
ALTER SYSTEM SET log_connections = on;
ALTER SYSTEM SET log_disconnections = on;
ALTER SYSTEM SET log_lock_waits = on;

-- Create a function to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a function for soft deletes
CREATE OR REPLACE FUNCTION soft_delete()
RETURNS TRIGGER AS $$
BEGIN
    -- Use IF-ELSIF structure instead of CASE for table-specific updates
    IF TG_TABLE_NAME = 'tech_requests' THEN
        UPDATE tech_requests SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
    ELSIF TG_TABLE_NAME = 'available_slots' THEN
        UPDATE available_slots SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
    ELSIF TG_TABLE_NAME = 'admin_users' THEN
        UPDATE admin_users SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
    END IF;
    
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Create indexes for common queries (these will be created by Prisma, but good to have as reference)
-- Note: These are examples and may need to be adjusted based on actual schema

-- Partial index for active (non-deleted) records
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_help_requests_active 
--     ON "HelpRequest" (created_at DESC) 
--     WHERE deleted_at IS NULL;

-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_time_slots_available 
--     ON "TimeSlot" (start_time) 
--     WHERE is_available = true AND deleted_at IS NULL;

-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_admins_active 
--     ON "Admin" (email) 
--     WHERE is_active = true AND deleted_at IS NULL;

-- Performance monitoring view
CREATE OR REPLACE VIEW slow_queries AS
SELECT
    query,
    calls,
    total_exec_time,
    mean_exec_time,
    max_exec_time,
    stddev_exec_time,
    (total_exec_time / sum(total_exec_time) OVER ()) * 100 AS percentage
FROM pg_stat_statements
WHERE calls > 10
ORDER BY total_exec_time DESC
LIMIT 20;

-- Database size monitoring view
CREATE OR REPLACE VIEW database_size AS
SELECT 
    pg_database.datname as database_name,
    pg_size_pretty(pg_database_size(pg_database.datname)) as size
FROM pg_database
WHERE pg_database.datname = 'helpsavta';

-- Table size monitoring view
CREATE OR REPLACE VIEW table_sizes AS
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
    pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY size_bytes DESC;

-- Index usage monitoring view
CREATE OR REPLACE VIEW index_usage AS
SELECT
    schemaname,
    relname as tablename,
    indexrelname as indexname,
    idx_tup_read,
    idx_tup_fetch,
    pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_stat_user_indexes
ORDER BY idx_tup_read DESC;

-- Connection monitoring view
CREATE OR REPLACE VIEW active_connections AS
SELECT 
    pid,
    usename,
    application_name,
    client_addr,
    backend_start,
    state,
    query_start,
    LEFT(query, 100) as query_preview
FROM pg_stat_activity
WHERE state != 'idle'
AND pid != pg_backend_pid()
ORDER BY backend_start;

-- Lock monitoring view  
CREATE OR REPLACE VIEW lock_status AS
SELECT 
    t.schemaname,
    t.tablename,
    l.locktype,
    l.mode,
    l.granted,
    a.pid,
    a.usename,
    a.query_start,
    LEFT(a.query, 100) as query_preview
FROM pg_locks l
JOIN pg_stat_activity a ON l.pid = a.pid
JOIN pg_tables t ON l.relation = (t.schemaname||'.'||t.tablename)::regclass
WHERE t.schemaname = 'public'
ORDER BY l.granted, l.pid;

-- Insert initial configuration data
-- This will be handled by Prisma seed scripts, but keeping as reference

-- Log the initialization
INSERT INTO pg_stat_statements_info (dealloc) VALUES (0);

-- Create a health check function for monitoring
CREATE OR REPLACE FUNCTION health_check()
RETURNS TABLE(
    status text,
    database_size text,
    active_connections bigint,
    longest_running_query interval
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'healthy'::text as status,
        pg_size_pretty(pg_database_size(current_database())) as database_size,
        (SELECT count(*) FROM pg_stat_activity WHERE state = 'active') as active_connections,
        (SELECT max(now() - query_start) FROM pg_stat_activity WHERE state = 'active') as longest_running_query;
END;
$$ LANGUAGE plpgsql;

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'HelpSavta database initialization completed successfully';
END $$;