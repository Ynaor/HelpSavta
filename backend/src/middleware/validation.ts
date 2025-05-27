import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

/**
 * Generic validation middleware factory
 * מפעל ליצירת מידלוור לבדיקת תקינות נתונים
 */
export const validateBody = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      res.status(400).json({
        error: 'Validation failed',
        message: 'נתונים לא תקינים',
        details: errors
      });
      return;
    }

    req.body = value;
    next();
  };
};

/**
 * Validation schemas for different endpoints
 * סכמות בדיקה לנקודות גישה שונות
 */
export const schemas = {
  // Tech request validation - בדיקת בקשת עזרה טכנית
  techRequest: Joi.object({
    full_name: Joi.string().min(2).max(100).required().messages({
      'string.min': 'שם חייב להכיל לפחות 2 תווים',
      'string.max': 'שם חייב להכיל עד 100 תווים',
      'any.required': 'שם מלא הוא שדה חובה'
    }),
    phone: Joi.string().pattern(/^0[2-9]\d{7,8}$/).required().messages({
      'string.pattern.base': 'מספר טלפון לא תקין (צריך להתחיל ב-0 ולהכיל 9-10 ספרות)',
      'any.required': 'מספר טלפון הוא שדה חובה'
    }),
    address: Joi.string().min(5).max(200).required().messages({
      'string.min': 'כתובת חייבת להכיל לפחות 5 תווים',
      'string.max': 'כתובת חייבת להכיל עד 200 תווים',
      'any.required': 'כתובת היא שדה חובה'
    }),
    problem_description: Joi.string().min(10).max(1000).required().messages({
      'string.min': 'תיאור הבעיה חייב להכיל לפחות 10 תווים',
      'string.max': 'תיאור הבעיה חייב להכיל עד 1000 תווים',
      'any.required': 'תיאור הבעיה הוא שדה חובה'
    }),
    urgency_level: Joi.string().valid('low', 'medium', 'high', 'urgent').default('medium').messages({
      'any.only': 'רמת דחיפות חייבת להיות: low, medium, high, או urgent'
    }),
    notes: Joi.string().max(500).optional().allow('').messages({
      'string.max': 'הערות חייבות להכיל עד 500 תווים'
    })
  }),

  // Available slot validation - בדיקת זמן זמין
  availableSlot: Joi.object({
    date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required().messages({
      'string.pattern.base': 'תאריך חייב להיות בפורמט YYYY-MM-DD',
      'any.required': 'תאריך הוא שדה חובה'
    }),
    start_time: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required().messages({
      'string.pattern.base': 'שעת התחלה חייבת להיות בפורמט HH:MM',
      'any.required': 'שעת התחלה היא שדה חובה'
    }),
    end_time: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required().messages({
      'string.pattern.base': 'שעת סיום חייבת להיות בפורמט HH:MM',
      'any.required': 'שעת סיום היא שדה חובה'
    })
  }),

  // Admin login validation - בדיקת התחברות מנהל
  adminLogin: Joi.object({
    username: Joi.string().min(3).max(50).required().messages({
      'string.min': 'שם משתמש חייב להכיל לפחות 3 תווים',
      'string.max': 'שם משתמש חייב להכיל עד 50 תווים',
      'any.required': 'שם משתמש הוא שדה חובה'
    }),
    password: Joi.string().min(6).required().messages({
      'string.min': 'סיסמה חייבת להכיל לפחות 6 תווים',
      'any.required': 'סיסמה היא שדה חובה'
    })
  }),

  // Update request status validation - בדיקת עדכון סטטוס בקשה
  updateRequestStatus: Joi.object({
    status: Joi.string().valid('pending', 'in_progress', 'completed', 'cancelled').required().messages({
      'any.only': 'סטטוס חייב להיות: pending, in_progress, completed, או cancelled',
      'any.required': 'סטטוס הוא שדה חובה'
    }),
    notes: Joi.string().max(500).optional().allow('').messages({
      'string.max': 'הערות חייבות להכיל עד 500 תווים'
    }),
    scheduled_date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional().messages({
      'string.pattern.base': 'תאריך מתוכנן חייב להיות בפורמט YYYY-MM-DD'
    }),
    scheduled_time: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional().messages({
      'string.pattern.base': 'שעה מתוכננת חייבת להיות בפורמט HH:MM'
    })
  }),

  // Admin request update validation - בדיקת עדכון בקשה על ידי מנהל
  adminRequestUpdate: Joi.object({
    full_name: Joi.string().min(2).max(100).optional().messages({
      'string.min': 'שם חייב להכיל לפחות 2 תווים',
      'string.max': 'שם חייב להכיל עד 100 תווים'
    }),
    phone: Joi.string().pattern(/^0[2-9]\d{7,8}$/).optional().messages({
      'string.pattern.base': 'מספר טלפון לא תקין (צריך להתחיל ב-0 ולהכיל 9-10 ספרות)'
    }),
    address: Joi.string().min(5).max(200).optional().messages({
      'string.min': 'כתובת חייבת להכיל לפחות 5 תווים',
      'string.max': 'כתובת חייבת להכיל עד 200 תווים'
    }),
    problem_description: Joi.string().min(10).max(1000).optional().messages({
      'string.min': 'תיאור הבעיה חייב להכיל לפחות 10 תווים',
      'string.max': 'תיאור הבעיה חייב להכיל עד 1000 תווים'
    }),
    urgency_level: Joi.string().valid('low', 'medium', 'high', 'urgent').optional().messages({
      'any.only': 'רמת דחיפות חייבת להיות: low, medium, high, או urgent'
    }),
    status: Joi.string().valid('pending', 'in_progress', 'completed', 'cancelled').optional().messages({
      'any.only': 'סטטוס חייב להיות: pending, in_progress, completed, או cancelled'
    }),
    notes: Joi.string().max(500).optional().allow('').messages({
      'string.max': 'הערות חייבות להכיל עד 500 תווים'
    }),
    scheduled_date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional().messages({
      'string.pattern.base': 'תאריך מתוכנן חייב להיות בפורמט YYYY-MM-DD'
    }),
    scheduled_time: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional().messages({
      'string.pattern.base': 'שעה מתוכננת חייבת להיות בפורמט HH:MM'
    }),
    assigned_admin_id: Joi.number().integer().positive().optional().messages({
      'number.base': 'מזהה מנהל חייב להיות מספר',
      'number.integer': 'מזהה מנהל חייב להיות מספר שלם',
      'number.positive': 'מזהה מנהל חייב להיות מספר חיובי'
    })
  }).min(1).messages({
    'object.min': 'נדרש לפחות שדה אחד לעדכון'
  }),

  // Admin take request validation - בדיקת "לקיחת" בקשה על ידי מנהל
  adminTakeRequest: Joi.object({
    notes: Joi.string().max(500).optional().allow('').messages({
      'string.max': 'הערות חייבות להכיל עד 500 תווים'
    })
  })
};