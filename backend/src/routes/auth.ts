import express from 'express';
import * as bcrypt from 'bcryptjs';
import { prisma } from '../server';
import { validateBody, schemas } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';
import { requireAuth } from '../middleware/auth';

const router = express.Router();

/**
 * POST /api/auth/login - Admin login
 * התחברות מנהל מערכת
 */
router.post('/login', validateBody(schemas.adminLogin), asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  // Find admin user
  const admin = await prisma.adminUser.findUnique({
    where: { username }
  });

  if (!admin || !(admin as any).is_active) {
    return res.status(401).json({
      success: false,
      error: 'Invalid credentials',
      message: 'שם משתמש או סיסמה שגויים'
    });
  }

  // Check password
  const isValidPassword = await bcrypt.compare(password, admin.password_hash);
  if (!isValidPassword) {
    return res.status(401).json({
      success: false,
      error: 'Invalid credentials',
      message: 'שם משתמש או סיסמה שגויים'
    });
  }

  // Set session
  req.session.userId = admin.id;
  req.session.username = admin.username;
  req.session.role = (admin as any).role;

  // DEBUG: Log session and cookie details for diagnosis
  console.log('=== LOGIN SESSION DEBUG ===');
  console.log('Session ID:', req.sessionID);
  console.log('Session data before save:', {
    userId: req.session.userId,
    username: req.session.username,
    role: req.session.role
  });
  console.log('Cookie configuration:', {
    secure: req.session.cookie.secure,
    sameSite: req.session.cookie.sameSite,
    domain: req.session.cookie.domain,
    httpOnly: req.session.cookie.httpOnly,
    maxAge: req.session.cookie.maxAge
  });
  console.log('Request headers origin:', req.get('origin'));
  console.log('Environment NODE_ENV:', process.env.NODE_ENV);

  // Force session save and log result
  req.session.save((err) => {
    if (err) {
      console.error('SESSION SAVE ERROR:', err);
    } else {
      console.log('Session saved successfully');
      console.log('Session after save:', req.session);
      console.log('Response headers will include Set-Cookie:', req.session.cookie);
    }
  });

  res.json({
    success: true,
    message: 'התחברת בהצלחה',
    data: {
      id: admin.id,
      username: admin.username,
      role: (admin as any).role
    }
  });
}));

/**
 * POST /api/auth/logout - Admin logout
 * התנתקות מנהל מערכת
 */
router.post('/logout', asyncHandler(async (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        error: 'Logout failed',
        message: 'שגיאה בהתנתקות'
      });
    }

    res.clearCookie('connect.sid');
    res.json({
      success: true,
      message: 'התנתקת בהצלחה'
    });
  });
}));

/**
 * GET /api/auth/me - Get current admin user
 * קבלת פרטי המנהל הנוכחי
 */
router.get('/me', requireAuth, asyncHandler(async (req, res) => {
  const admin = await prisma.adminUser.findUnique({
    where: { id: req.session.userId }
  });

  if (!admin) {
    return res.status(404).json({
      success: false,
      error: 'Admin not found',
      message: 'משתמש לא נמצא'
    });
  }

  res.json({
    success: true,
    data: {
      id: admin.id,
      username: admin.username,
      role: (admin as any).role,
      created_at: admin.created_at,
      updated_at: admin.updated_at
    }
  });
}));

/**
 * GET /api/auth/status - Check authentication status
 * בדיקת סטטוס אימות
 */
router.get('/status', asyncHandler(async (req, res) => {
  const isAuthenticated = !!req.session.userId;
  
  // DEBUG: Log session status check details
  console.log('=== AUTH STATUS DEBUG ===');
  console.log('Session ID:', req.sessionID);
  console.log('Session data:', {
    userId: req.session.userId,
    username: req.session.username,
    role: req.session.role
  });
  console.log('Is authenticated:', isAuthenticated);
  console.log('Request cookies:', req.headers.cookie);
  console.log('Request origin:', req.get('origin'));
  console.log('Session cookie config:', {
    secure: req.session.cookie.secure,
    sameSite: req.session.cookie.sameSite,
    domain: req.session.cookie.domain,
    httpOnly: req.session.cookie.httpOnly
  });
  
  res.json({
    success: true,
    data: {
      authenticated: isAuthenticated,
      user: isAuthenticated ? {
        id: req.session.userId,
        username: req.session.username,
        role: req.session.role
      } : null
    }
  });
}));

export default router;