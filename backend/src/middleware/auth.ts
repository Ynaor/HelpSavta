import { Request, Response, NextFunction } from 'express';

// Extend Express Request type to include user session
declare module 'express-session' {
  interface SessionData {
    userId?: number;
    username?: string;
  }
}

/**
 * Middleware to check if user is authenticated as admin
 * בדיקה האם המשתמש מחובר כמנהל מערכת
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.session.userId) {
    res.status(401).json({ 
      error: 'Authentication required',
      message: 'נדרשת הזדהות למערכת'
    });
    return;
  }
  next();
};

/**
 * Middleware for optional authentication
 * מידלוור לאימות אופציונלי
 */
export const optionalAuth = (req: Request, res: Response, next: NextFunction): void => {
  // Always proceed, but set user info if available
  next();
};