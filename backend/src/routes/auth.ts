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

  if (!admin) {
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

  res.json({
    success: true,
    message: 'התחברת בהצלחה',
    data: {
      id: admin.id,
      username: admin.username
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
    where: { id: req.session.userId },
    select: {
      id: true,
      username: true,
      created_at: true,
      updated_at: true
    }
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
    data: admin
  });
}));

/**
 * GET /api/auth/status - Check authentication status
 * בדיקת סטטוס אימות
 */
router.get('/status', asyncHandler(async (req, res) => {
  const isAuthenticated = !!req.session.userId;
  
  res.json({
    success: true,
    authenticated: isAuthenticated,
    user: isAuthenticated ? {
      id: req.session.userId,
      username: req.session.username
    } : null
  });
}));

export default router;