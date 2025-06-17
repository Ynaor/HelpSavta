import { Request, Response, NextFunction } from 'express';
import { prisma } from '../server';
import { AdminRole, ADMIN_ROLES, hasPermission } from '../types/adminRoles';

// Extend Express Request type to include user session
declare module 'express-session' {
  interface SessionData {
    userId?: number;
    username?: string;
    role?: AdminRole;
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
 * Middleware to require specific role(s)
 * מידלוור לבדיקת תפקיד ספציפי
 */
export const requireRole = (...allowedRoles: AdminRole[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.session.userId) {
      res.status(401).json({
        error: 'Authentication required',
        message: 'נדרשת הזדהות למערכת'
      });
      return;
    }

    // Get user role from session first, then verify against database
    let userRole = req.session.role;
    
    // If role not in session or we need to verify, get from database
    if (!userRole) {
      try {
        const admin = await prisma.adminUser.findUnique({
          where: { id: req.session.userId }
        });

        if (!admin) {
          res.status(401).json({
            error: 'Admin not found',
            message: 'משתמש מנהל לא נמצא'
          });
          return;
        }

        userRole = (admin as any).role as AdminRole;
        // Update session with role
        req.session.role = userRole;
      } catch (error) {
        console.error('Error fetching admin role:', error);
        res.status(500).json({
          error: 'Failed to verify permissions',
          message: 'שגיאה בבדיקת הרשאות'
        });
        return;
      }
    }

    // Check if user has any of the allowed roles
    if (!allowedRoles.includes(userRole)) {
      res.status(403).json({
        error: 'Insufficient permissions',
        message: 'אין הרשאות מספיקות לביצוע פעולה זו'
      });
      return;
    }

    next();
  };
};

/**
 * Convenience middleware to require SYSTEM_ADMIN role
 * מידלוור נוחות לדרישת תפקיד מנהל מערכת
 */
export const requireSystemAdmin = requireRole(ADMIN_ROLES.SYSTEM_ADMIN);

/**
 * Convenience middleware to require any admin role (SYSTEM_ADMIN or VOLUNTEER)
 * מידלוור נוחות לדרישת כל תפקיד מנהל
 */
export const requireAnyAdmin = requireRole(ADMIN_ROLES.SYSTEM_ADMIN, ADMIN_ROLES.VOLUNTEER);

/**
 * Middleware to check request ownership for volunteers
 * מידלוור לבדיקת בעלות על בקשה עבור מתנדבים
 */
export const requireRequestOwnership = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  if (!req.session.userId || !req.session.role) {
    res.status(401).json({
      error: 'Authentication required',
      message: 'נדרשת הזדהות למערכת'
    });
    return;
  }

  // SYSTEM_ADMIN can access any request
  if (req.session.role === ADMIN_ROLES.SYSTEM_ADMIN) {
    next();
    return;
  }

  // For VOLUNTEER role, check ownership
  if (req.session.role === ADMIN_ROLES.VOLUNTEER) {
    const requestId = parseInt(req.params.id!);
    
    if (isNaN(requestId)) {
      res.status(400).json({
        error: 'Invalid request ID',
        message: 'מזהה בקשה לא תקין'
      });
      return;
    }

    try {
      const request = await prisma.techRequest.findUnique({
        where: { id: requestId },
        select: { assigned_admin_id: true }
      });

      if (!request) {
        res.status(404).json({
          error: 'Request not found',
          message: 'בקשה לא נמצאה'
        });
        return;
      }

      // Allow if request is unassigned or assigned to current volunteer
      if (!request.assigned_admin_id || request.assigned_admin_id === req.session.userId) {
        next();
        return;
      }

      res.status(403).json({
        error: 'Access denied - request assigned to another volunteer',
        message: 'גישה נדחתה - הבקשה מוקצית למתנדב אחר'
      });
      return;
    } catch (error) {
      console.error('Error checking request ownership:', error);
      res.status(500).json({
        error: 'Failed to verify request ownership',
        message: 'שגיאה בבדיקת בעלות על הבקשה'
      });
      return;
    }
  }

  res.status(403).json({
    error: 'Insufficient permissions',
    message: 'אין הרשאות מספיקות'
  });
};

/**
 * Middleware for optional authentication
 * מידלוור לאימות אופציונלי
 */
export const optionalAuth = (req: Request, res: Response, next: NextFunction): void => {
  // Always proceed, but set user info if available
  next();
};