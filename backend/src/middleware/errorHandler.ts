import { Request, Response, NextFunction } from 'express';

/**
 * Error interface for structured error handling
 * ממשק שגיאות לטיפול מובנה בשגיאות
 */
interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

/**
 * Global error handling middleware
 * מידלוור לטיפול גלובלי בשגיאות
 */
export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Default error values
  let statusCode = err.statusCode || 500;
  let message = err.message || 'שגיאה פנימית בשרת';
  let hebrewMessage = 'אירעה שגיאה לא צפויה';

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    hebrewMessage = 'נתונים לא תקינים';
  } else if (err.name === 'UnauthorizedError') {
    statusCode = 401;
    hebrewMessage = 'נדרשת הזדהות למערכת';
  } else if (err.name === 'PrismaClientKnownRequestError') {
    statusCode = 400;
    hebrewMessage = 'שגיאה בבסיס הנתונים';
  }

  // Don't leak error details in production
  const response: any = {
    success: false,
    error: message,
    message: hebrewMessage
  };

  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
    response.details = err;
  }

  res.status(statusCode).json(response);
};

/**
 * 404 Not Found handler
 * טיפול בבקשות לנתיבים שאינם קיימים
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    message: 'הנתיב המבוקש לא נמצא',
    url: req.originalUrl
  });
};

/**
 * Async error wrapper for route handlers
 * עטיפה לטיפול בשגיאות אסינכרוניות
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Create custom error
 * יצירת שגיאה מותאמת אישית
 */
export const createError = (message: string, statusCode: number = 500): AppError => {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
};