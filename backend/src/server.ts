import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import session from 'express-session';
import rateLimit from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';

// Import configuration
import { environment } from './config/environment';
import { createPrismaClient, checkDatabaseConnection } from './config/database.production';

// Import middleware
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// Import routes
import requestRoutes from './routes/requests';
import slotRoutes from './routes/slots';
import adminRoutes from './routes/admin';
import authRoutes from './routes/auth';
import testRoutes from './routes/test';
import calendarRoutes from './routes/calendar';

// Initialize Prisma client based on environment
export const prisma = environment.isProduction || environment.isStaging
  ? createPrismaClient()
  : new PrismaClient();

// Create Express app
const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
app.use(cors(environment.security.cors));

// Rate limiting
const limiter = rateLimit({
  windowMs: environment.security.rateLimit.windowMs,
  max: environment.security.rateLimit.max,
  message: {
    error: 'Too many requests',
    message: 'יותר מדי בקשות, נסה שוב מאוחר יותר',
    retryAfter: Math.ceil(environment.security.rateLimit.windowMs / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Session configuration
app.use(session({
  secret: environment.session.secret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: environment.session.secure,
    httpOnly: environment.session.httpOnly,
    maxAge: environment.session.maxAge,
    sameSite: environment.session.sameSite as any
  }
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint with database connectivity
app.get(environment.healthCheck.path, async (req, res) => {
  try {
    const dbConnected = await checkDatabaseConnection(prisma);
    
    res.json({
      status: dbConnected ? 'OK' : 'DEGRADED',
      message: dbConnected ? 'המערכת פועלת תקין' : 'בעיה בחיבור למסד נתונים',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: environment.NODE_ENV,
      database: {
        connected: dbConnected,
        type: environment.isProduction ? 'PostgreSQL' : 'SQLite'
      },
      version: '1.0.0'
    });
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      message: 'בעיה במערכת',
      timestamp: new Date().toISOString(),
      environment: environment.NODE_ENV,
      error: environment.isDevelopment ? error : 'Internal server error'
    });
  }
});

// API routes
app.use('/api/requests', requestRoutes);
app.use('/api/slots', slotRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/test', testRoutes);
app.use('/api/admin', calendarRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'ברוכים הבאים למערכת עזרה טכנית בהתנדבות',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      requests: '/api/requests',
      slots: '/api/slots',
      admin: '/api/admin',
      auth: '/api/auth',
      calendar: '/api/admin/calendar-data'
    }
  });
});

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Received SIGINT, shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

// Start server
const server = app.listen(environment.server.port, environment.server.host, async () => {
  console.log(`🚀 Server running on ${environment.server.host}:${environment.server.port}`);
  console.log(`🌐 Health check: http://localhost:${environment.server.port}${environment.healthCheck.path}`);
  console.log(`📚 API docs: http://localhost:${environment.server.port}/api`);
  console.log(`🔒 Environment: ${environment.NODE_ENV}`);
  console.log(`💾 Database: ${environment.isProduction ? 'PostgreSQL' : 'SQLite'}`);
  
  // Check database connection on startup
  try {
    const dbConnected = await checkDatabaseConnection(prisma);
    if (dbConnected) {
      console.log('✅ Database connection successful');
    } else {
      console.error('❌ Database connection failed');
    }
  } catch (error) {
    console.error('❌ Database connection error:', error);
  }
});

export default app;