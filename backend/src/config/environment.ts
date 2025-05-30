import { config } from 'dotenv';
import Joi from 'joi';

// Load environment variables
config();

// Environment validation schema
const envSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'staging', 'production', 'test')
    .default('development'),
  
  // Server Configuration
  PORT: Joi.number().port().default(3001),
  
  // Database Configuration
  DATABASE_URL: Joi.string().required(),
  
  // Redis Configuration (for session store in production)
  REDIS_URL: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  
  // Session Configuration
  SESSION_SECRET: Joi.string().min(32).required(),
  SESSION_MAX_AGE: Joi.number().default(24 * 60 * 60 * 1000), // 24 hours
  
  // Security Configuration
  RATE_LIMIT_WINDOW_MS: Joi.number().default(15 * 60 * 1000), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: Joi.number().default(100),
  
  // CORS Configuration
  FRONTEND_URL: Joi.string().uri().required(),
  ALLOWED_ORIGINS: Joi.string().default(''),
  
  // Admin Configuration
  DEFAULT_ADMIN_USERNAME: Joi.string().min(3).required(),
  DEFAULT_ADMIN_PASSWORD: Joi.string().min(8).required(),
  
  // Email Configuration
  EMAIL_HOST: Joi.string().required(),
  EMAIL_PORT: Joi.number().port().default(587),
  EMAIL_USER: Joi.string().email().required(),
  EMAIL_PASS: Joi.string().required(),
  EMAIL_FROM: Joi.string().email().required(),
  EMAIL_SECURE: Joi.boolean().default(false),
  
  // SMS Configuration (optional)
  SMS_API_KEY: Joi.string().optional(),
  SMS_PROVIDER: Joi.string().valid('twilio', 'nexmo', 'aws-sns').optional(),
  
  // Logging Configuration
  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'debug')
    .default('info'),
  
  // Health Check Configuration
  HEALTH_CHECK_PATH: Joi.string().default('/health'),
  
  // Database Pool Configuration
  DB_POOL_MIN: Joi.number().min(0).default(2),
  DB_POOL_MAX: Joi.number().min(1).default(20),
  DB_POOL_ACQUIRE_TIMEOUT: Joi.number().default(60000),
  DB_POOL_IDLE_TIMEOUT: Joi.number().default(10000),
}).unknown();

// Validate environment variables
const { error, value: env } = envSchema.validate(process.env);

if (error) {
  throw new Error(`Environment validation error: ${error.message}`);
}

// Environment configuration object
export const environment = {
  // Environment
  NODE_ENV: env.NODE_ENV as 'development' | 'staging' | 'production' | 'test',
  isDevelopment: env.NODE_ENV === 'development',
  isStaging: env.NODE_ENV === 'staging',
  isProduction: env.NODE_ENV === 'production',
  isTest: env.NODE_ENV === 'test',
  
  // Server
  server: {
    port: env.PORT,
    host: env.HOST || '0.0.0.0',
  },
  
  // Database
  database: {
    url: env.DATABASE_URL,
    pool: {
      min: env.DB_POOL_MIN,
      max: env.DB_POOL_MAX,
      acquireTimeoutMillis: env.DB_POOL_ACQUIRE_TIMEOUT,
      idleTimeoutMillis: env.DB_POOL_IDLE_TIMEOUT,
    },
  },
  
  // Redis (for production session store)
  redis: {
    url: env.REDIS_URL,
    enabled: env.NODE_ENV === 'production' && !!env.REDIS_URL,
  },
  
  // Session
  session: {
    secret: env.SESSION_SECRET,
    maxAge: env.SESSION_MAX_AGE,
    secure: env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: env.NODE_ENV === 'production' ? 'strict' : 'lax',
  },
  
  // Security
  security: {
    rateLimit: {
      windowMs: env.RATE_LIMIT_WINDOW_MS,
      max: env.RATE_LIMIT_MAX_REQUESTS,
    },
    cors: {
      origin: env.NODE_ENV === 'production' 
        ? (env.ALLOWED_ORIGINS ? env.ALLOWED_ORIGINS.split(',') : [env.FRONTEND_URL])
        : true,
      credentials: true,
    },
  },
  
  // Admin
  admin: {
    defaultUsername: env.DEFAULT_ADMIN_USERNAME,
    defaultPassword: env.DEFAULT_ADMIN_PASSWORD,
  },
  
  // Email
  email: {
    host: env.EMAIL_HOST,
    port: env.EMAIL_PORT,
    secure: env.EMAIL_SECURE,
    auth: {
      user: env.EMAIL_USER,
      pass: env.EMAIL_PASS,
    },
    from: env.EMAIL_FROM,
  },
  
  // SMS (optional)
  sms: {
    apiKey: env.SMS_API_KEY,
    provider: env.SMS_PROVIDER,
    enabled: !!env.SMS_API_KEY,
  },
  
  // Logging
  logging: {
    level: env.LOG_LEVEL,
    format: env.NODE_ENV === 'production' ? 'json' : 'combined',
  },
  
  // Health Check
  healthCheck: {
    path: env.HEALTH_CHECK_PATH,
  },
};

// Export specific configurations
export const {
  NODE_ENV,
  isDevelopment,
  isStaging,
  isProduction,
  isTest,
} = environment;

export default environment;