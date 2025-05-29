#!/usr/bin/env node

/**
 * Health check script for HelpSavta Backend
 * Used by Docker containers and load balancers
 */

const http = require('http');
const https = require('https');
const { URL } = require('url');

// Configuration
const HOST = process.env.HOST || 'localhost';
const PORT = process.env.PORT || 3001;
const PROTOCOL = process.env.HTTPS === 'true' ? 'https' : 'http';
const TIMEOUT = parseInt(process.env.HEALTHCHECK_TIMEOUT || '5000', 10);
const HEALTH_ENDPOINT = process.env.HEALTH_ENDPOINT || '/health';

// Health check URL
const healthUrl = `${PROTOCOL}://${HOST}:${PORT}${HEALTH_ENDPOINT}`;

/**
 * Perform health check
 */
function performHealthCheck() {
    return new Promise((resolve, reject) => {
        const url = new URL(healthUrl);
        const client = url.protocol === 'https:' ? https : http;
        
        const req = client.request(url, {
            method: 'GET',
            timeout: TIMEOUT,
            headers: {
                'User-Agent': 'HealthCheck/1.0'
            }
        }, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                if (res.statusCode === 200) {
                    try {
                        const healthData = JSON.parse(data);
                        resolve({
                            status: 'healthy',
                            statusCode: res.statusCode,
                            data: healthData
                        });
                    } catch (e) {
                        // If not JSON, assume text response
                        resolve({
                            status: 'healthy',
                            statusCode: res.statusCode,
                            data: { message: data.trim() }
                        });
                    }
                } else {
                    reject(new Error(`Health check failed with status ${res.statusCode}: ${data}`));
                }
            });
        });
        
        req.on('error', (err) => {
            reject(new Error(`Health check request failed: ${err.message}`));
        });
        
        req.on('timeout', () => {
            req.destroy();
            reject(new Error(`Health check timed out after ${TIMEOUT}ms`));
        });
        
        req.end();
    });
}

/**
 * Additional health checks
 */
async function checkDatabaseConnection() {
    try {
        // Simple database connectivity check
        const dbUrl = `${PROTOCOL}://${HOST}:${PORT}/api/health/db`;
        
        return new Promise((resolve) => {
            const url = new URL(dbUrl);
            const client = url.protocol === 'https:' ? https : http;
            
            const req = client.request(url, {
                method: 'GET',
                timeout: 3000,
                headers: {
                    'User-Agent': 'HealthCheck/1.0'
                }
            }, (res) => {
                let data = '';
                
                res.on('data', (chunk) => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    resolve({
                        database: res.statusCode === 200 ? 'connected' : 'disconnected',
                        statusCode: res.statusCode
                    });
                });
            });
            
            req.on('error', () => {
                resolve({ database: 'disconnected', error: 'connection_failed' });
            });
            
            req.on('timeout', () => {
                req.destroy();
                resolve({ database: 'disconnected', error: 'timeout' });
            });
            
            req.end();
        });
    } catch (error) {
        return { database: 'disconnected', error: error.message };
    }
}

/**
 * Main health check function
 */
async function main() {
    const startTime = Date.now();
    
    try {
        console.log(`Performing health check on ${healthUrl}`);
        
        // Basic health check
        const healthResult = await performHealthCheck();
        
        // Additional checks for verbose mode
        if (process.env.VERBOSE_HEALTHCHECK === 'true') {
            const dbResult = await checkDatabaseConnection();
            healthResult.database = dbResult;
        }
        
        const duration = Date.now() - startTime;
        
        console.log('✓ Health check passed');
        console.log(`Status: ${healthResult.status}`);
        console.log(`Response time: ${duration}ms`);
        
        if (healthResult.data) {
            console.log('Health data:', JSON.stringify(healthResult.data, null, 2));
        }
        
        process.exit(0);
        
    } catch (error) {
        const duration = Date.now() - startTime;
        
        console.error('✗ Health check failed');
        console.error(`Error: ${error.message}`);
        console.error(`Response time: ${duration}ms`);
        
        process.exit(1);
    }
}

// Handle process signals
process.on('SIGTERM', () => {
    console.log('Health check interrupted');
    process.exit(1);
});

process.on('SIGINT', () => {
    console.log('Health check interrupted');
    process.exit(1);
});

// Run health check
if (require.main === module) {
    main().catch((error) => {
        console.error('Health check error:', error.message);
        process.exit(1);
    });
}

module.exports = {
    performHealthCheck,
    checkDatabaseConnection
};