import express from 'express';
import * as bcrypt from 'bcryptjs';
import { prisma } from '../server';
import { requireAuth } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { validateBody, schemas } from '../middleware/validation';
import { emailService } from '../services/emailService';

const router = express.Router();

// All admin routes require authentication
router.use(requireAuth);

/**
 * GET /api/admin/dashboard - Get dashboard statistics
 * קבלת סטטיסטיקות לוח הבקרה
 */
router.get('/dashboard', asyncHandler(async (req, res) => {
  const [
    totalRequests,
    pendingRequests,
    inProgressRequests,
    completedRequests,
    totalSlots,
    availableSlots,
    bookedSlots
  ] = await Promise.all([
    prisma.techRequest.count(),
    prisma.techRequest.count({ where: { status: 'pending' } }),
    prisma.techRequest.count({ where: { status: 'in_progress' } }),
    prisma.techRequest.count({ where: { status: 'completed' } }),
    prisma.availableSlot.count(),
    prisma.availableSlot.count({ where: { is_booked: false } }),
    prisma.availableSlot.count({ where: { is_booked: true } })
  ]);

  // Get recent requests
  const recentRequests = await prisma.techRequest.findMany({
    take: 5,
    orderBy: { created_at: 'desc' },
    include: {
      booked_slot: true,
      assigned_admin: {
        select: {
          id: true,
          username: true,
          created_at: true,
          updated_at: true
        }
      }
    }
  });

  // Get in-progress requests for dashboard
  const dashboardInProgressRequests = await prisma.techRequest.findMany({
    where: {
      status: 'in_progress'
    },
    orderBy: { created_at: 'desc' },
    include: {
      booked_slot: true,
      assigned_admin: {
        select: {
          id: true,
          username: true,
          created_at: true,
          updated_at: true
        }
      }
    }
  });

  res.json({
    success: true,
    data: {
      statistics: {
        requests: {
          total: totalRequests,
          pending: pendingRequests,
          in_progress: inProgressRequests,
          completed: completedRequests
        },
        slots: {
          total: totalSlots,
          available: availableSlots,
          booked: bookedSlots
        }
      },
      recentRequests,
      inProgressRequests: dashboardInProgressRequests
    }
  });
}));

/**
 * GET /api/admin/requests - Get all requests with filtering (Admin view)
 * קבלת כל הבקשות עם סינון (תצוגת מנהל)
 */
router.get('/requests', asyncHandler(async (req, res) => {
  const { 
    status, 
    urgency_level, 
    date_from, 
    date_to, 
    search,
    page = 1, 
    limit = 20 
  } = req.query;
  
  const where: any = {};
  
  if (status) where.status = status;
  if (urgency_level) where.urgency_level = urgency_level;
  
  if (date_from || date_to) {
    where.created_at = {};
    if (date_from) where.created_at.gte = new Date(date_from as string);
    if (date_to) where.created_at.lte = new Date(date_to as string);
  }
  
  if (search) {
    where.OR = [
      { full_name: { contains: search as string } },
      { phone: { contains: search as string } },
      { problem_description: { contains: search as string } }
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  
  const [requests, total] = await Promise.all([
    prisma.techRequest.findMany({
      where,
      orderBy: { created_at: 'desc' },
      skip,
      take: Number(limit),
      include: {
        booked_slot: true,
        assigned_admin: {
          select: {
            id: true,
            username: true,
            created_at: true,
            updated_at: true
          }
        }
      }
    }),
    prisma.techRequest.count({ where })
  ]);

  res.json({
    success: true,
    data: requests,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit))
    }
  });
}));

/**
 * POST /api/admin/slots/bulk - Create multiple slots
 * יצירת מספר שעות בבת אחת
 */
router.post('/slots/bulk', asyncHandler(async (req, res) => {
  const { dates, start_time, end_time } = req.body;
  
  if (!Array.isArray(dates) || dates.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Dates array is required',
      message: 'נדרש מערך תאריכים'
    });
  }

  const slots = dates.map(date => ({
    date,
    start_time,
    end_time,
    is_booked: false
  }));

  try {
    const createdSlots = await prisma.availableSlot.createMany({
      data: slots
    });

    res.status(201).json({
      success: true,
      message: `${createdSlots.count} שעות נוצרו בהצלחה`,
      data: { created: createdSlots.count }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: 'Failed to create slots',
      message: 'שגיאה ביצירת השעות'
    });
  }
}));

/**
 * GET /api/admin/notifications - Get notification logs
 * קבלת יומן התראות
 */
router.get('/notifications', asyncHandler(async (req, res) => {
  const { type, status, page = 1, limit = 20 } = req.query;
  
  const where: any = {};
  if (type) where.type = type;
  if (status) where.status = status;

  const skip = (Number(page) - 1) * Number(limit);
  
  const [notifications, total] = await Promise.all([
    prisma.notificationLog.findMany({
      where,
      orderBy: { sent_at: 'desc' },
      skip,
      take: Number(limit)
    }),
    prisma.notificationLog.count({ where })
  ]);

  res.json({
    success: true,
    data: notifications,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit))
    }
  });
}));

/**
 * POST /api/admin/create-admin - Create new admin user
 * יצירת משתמש מנהל חדש
 */
router.post('/create-admin', asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({
      success: false,
      error: 'Username and password are required',
      message: 'שם משתמש וסיסמה נדרשים'
    });
  }

  // Check if admin already exists
  const existingAdmin = await prisma.adminUser.findUnique({
    where: { username }
  });

  if (existingAdmin) {
    return res.status(400).json({
      success: false,
      error: 'Admin already exists',
      message: 'משתמש מנהל כבר קיים'
    });
  }

  // Hash password
  const saltRounds = 12;
  const password_hash = await bcrypt.hash(password, saltRounds);

  const newAdmin = await prisma.adminUser.create({
    data: {
      username,
      password_hash
    },
    select: {
      id: true,
      username: true,
      created_at: true
    }
  });

  res.status(201).json({
    success: true,
    message: 'משתמש מנהל נוצר בהצלחה',
    data: newAdmin
  });
}));

/**
 * GET /api/admin/admins - Get all admin users
 * קבלת כל משתמשי המנהל
 */
router.get('/admins', asyncHandler(async (req, res) => {
  const admins = await prisma.adminUser.findMany({
    orderBy: { created_at: 'desc' },
    select: {
      id: true,
      username: true,
      created_at: true,
      updated_at: true
      // Exclude password_hash for security
    }
  });

  res.json({
    success: true,
    data: admins
  });
}));

/**
 * PUT /api/admin/requests/:id - Update a request (all fields allowed for admin)
 * עדכון בקשה (כל השדות מותרים למנהל)
 */
router.put('/requests/:id', validateBody(schemas.adminRequestUpdate), asyncHandler(async (req, res) => {
  const requestId = parseInt(req.params.id);
  const updateData = req.body;
  
  if (isNaN(requestId)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid request ID',
      message: 'מזהה בקשה לא תקין'
    });
  }

  // Check if request exists
  const existingRequest = await prisma.techRequest.findUnique({
    where: { id: requestId }
  });

  if (!existingRequest) {
    return res.status(404).json({
      success: false,
      error: 'Request not found',
      message: 'בקשה לא נמצאה'
    });
  }

  // Store previous status for email logic
  const previousStatus = existingRequest.status;
  const currentStatus = updateData.status || previousStatus;

  try {
    // Update the request
    const updatedRequest = await prisma.techRequest.update({
      where: { id: requestId },
      data: updateData,
      include: {
        booked_slot: true,
        assigned_admin: {
          select: {
            id: true,
            username: true,
            created_at: true,
            updated_at: true
          }
        }
      }
    });

    // Email trigger logic for scheduled status removed - no longer using scheduled status

    res.json({
      success: true,
      message: 'בקשה עודכנה בהצלחה',
      data: updatedRequest
    });
  } catch (error) {
    console.error('Error updating request:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update request',
      message: 'שגיאה בעדכון הבקשה'
    });
  }
}));

/**
 * POST /api/admin/requests/:id/take - Admin "takes" a request (assigns themselves)
 * מנהל "לוקח" בקשה (מקצה את עצמו אליה)
 */
router.post('/requests/:id/take', validateBody(schemas.adminTakeRequest), asyncHandler(async (req, res) => {
  const requestId = parseInt(req.params.id);
  const { notes } = req.body;
  
  if (isNaN(requestId)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid request ID',
      message: 'מזהה בקשה לא תקין'
    });
  }

  // Get admin ID from session (stored as userId during login)
  const adminId = req.session.userId;
  
  if (!adminId) {
    return res.status(401).json({
      success: false,
      error: 'Admin ID not found in session',
      message: 'מזהה מנהל לא נמצא בסשן'
    });
  }

  // Check if request exists
  const existingRequest = await prisma.techRequest.findUnique({
    where: { id: requestId }
  });

  if (!existingRequest) {
    return res.status(404).json({
      success: false,
      error: 'Request not found',
      message: 'בקשה לא נמצאה'
    });
  }

  // Check if request is already assigned (using type assertion for now)
  if ((existingRequest as any).assigned_admin_id) {
    return res.status(400).json({
      success: false,
      error: 'Request already assigned',
      message: 'בקשה כבר מוקצית למנהל אחר'
    });
  }

  try {
    // Update request to assign current admin and set status to in_progress
    const updateData: any = {
      assigned_admin_id: adminId,
      status: 'in_progress'
    };
    
    // Add notes if provided
    if (notes) {
      updateData.notes = notes;
    }

    const updatedRequest = await prisma.techRequest.update({
      where: { id: requestId },
      data: updateData,
      include: {
        booked_slot: true,
        assigned_admin: {
          select: {
            id: true,
            username: true,
            created_at: true,
            updated_at: true
          }
        }
      }
    });

    // Send status update email notification (don't let email failure affect assignment)
    try {
      if (existingRequest.email && existingRequest.full_name) {
        await emailService.sendStatusUpdateEmail(
          existingRequest.email,
          existingRequest.full_name,
          requestId.toString(),
          'in_progress'
        );
        console.log(`📧 Status update email sent for request #${requestId}`);
      } else {
        console.log(`📧 Skipping email for request #${requestId} - missing email or name`);
      }
    } catch (emailError) {
      console.error('Failed to send status update email:', emailError);
      // Continue with response - email failure should not affect assignment
    }

    res.json({
      success: true,
      message: 'בקשה נלקחה בהצלחה',
      data: updatedRequest
    });
  } catch (error) {
    console.error('Error taking request:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to take request',
      message: 'שגיאה בלקיחת הבקשה'
    });
  }
}));

export default router;