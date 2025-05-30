-- Minimal Database initialization script for HelpSavta
-- This script sets up the essential database configuration for development

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

-- Create a function to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

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