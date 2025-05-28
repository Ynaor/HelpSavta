import express from 'express';
import { prisma } from '../server';
import { validateBody, schemas } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';
import { emailService } from '../services/emailService';

const router = express.Router();

/**
 * GET /api/requests - Get all tech requests
 * קבלת כל בקשות העזרה הטכנית
 */
/**
 * GET /api/requests/test-email - Test email service configuration
 * בדיקת הגדרות שירות האימייל
 */
router.get('/test-email', asyncHandler(async (req, res) => {
  const isReady = emailService.isReady();
  let connectionTest = false;
  
  if (isReady) {
    connectionTest = await emailService.testConnection();
  }
  
  // Check environment variables
  const envCheck = {
    EMAIL_HOST: !!process.env.EMAIL_HOST,
    EMAIL_PORT: !!process.env.EMAIL_PORT,
    EMAIL_USER: !!process.env.EMAIL_USER,
    EMAIL_PASS: !!process.env.EMAIL_PASS,
    EMAIL_FROM: !!process.env.EMAIL_FROM
  };
  
  res.json({
    success: true,
    data: {
      isReady,
      connectionTest,
      envCheck,
      missingEnvVars: Object.entries(envCheck)
        .filter(([key, value]) => !value)
        .map(([key]) => key)
    }
  });
}));

/**
 * GET /api/requests/test-send-email - Test sending email
 * בדיקת שליחת אימייל בפועל
 */
router.get('/test-send-email', asyncHandler(async (req, res) => {
  const testEmail = req.query.email as string || 'test@example.com';
  
  const success = await emailService.sendApprovalEmail(
    testEmail,
    'Test User',
    '2025-05-28',
    '14:00',
    999
  );
  
  // Get recent notification logs
  const logs = await prisma.notificationLog.findMany({
    orderBy: { sent_at: 'desc' },
    take: 5
  });
  
  res.json({
    success: true,
    data: {
      emailSent: success,
      testEmail,
      recentLogs: logs
    }
  });
}));

/**
 * GET /api/requests/notification-logs - Get notification logs
 * קבלת יומני התראות
 */
router.get('/notification-logs', asyncHandler(async (req, res) => {
  const logs = await prisma.notificationLog.findMany({
    orderBy: { sent_at: 'desc' },
    take: 20
  });
  
  res.json({
    success: true,
    data: logs
  });
}));

/**
 * GET /api/requests - Get all tech requests
 * קבלת כל בקשות העזרה הטכנית
 */
router.get('/', asyncHandler(async (req, res) => {
  const { status, urgency_level, page = 1, limit = 10 } = req.query;
  
  const where: any = {};
  if (status) where.status = status;
  if (urgency_level) where.urgency_level = urgency_level;

  const skip = (Number(page) - 1) * Number(limit);
  
  const [requests, total] = await Promise.all([
    prisma.techRequest.findMany({
      where,
      orderBy: { created_at: 'desc' },
      skip,
      take: Number(limit),
      include: {
        booked_slot: true
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
 * GET /api/requests/:id - Get specific tech request
 * קבלת בקשת עזרה טכנית ספציפית
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const request = await prisma.techRequest.findUnique({
    where: { id: parseInt(req.params.id) },
    include: {
      booked_slot: true
    }
  });

  if (!request) {
    return res.status(404).json({
      success: false,
      error: 'Request not found',
      message: 'בקשה לא נמצאה'
    });
  }

  res.json({
    success: true,
    data: request
  });
}));

/**
 * POST /api/requests - Create new tech request
 * יצירת בקשת עזרה טכנית חדשה
 */
router.post('/', validateBody(schemas.techRequest), asyncHandler(async (req, res) => {
  const request = await prisma.techRequest.create({
    data: {
      ...req.body,
      status: 'pending' // Explicitly set status to 'pending' for new requests
    }
  });

  res.status(201).json({
    success: true,
    message: 'בקשה נוצרה בהצלחה',
    data: request
  });
}));

/**
 * PUT /api/requests/:id - Update tech request
 * עדכון בקשת עזרה טכנית
 */
router.put('/:id', validateBody(schemas.updateRequestStatus), asyncHandler(async (req, res) => {
  const requestId = parseInt(req.params.id);
  
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
  const newStatus = req.body.status || previousStatus;

  const updatedRequest = await prisma.techRequest.update({
    where: { id: requestId },
    data: req.body,
    include: {
      booked_slot: true
    }
  });

  // Send email notification when status changes from "pending" to "in_progress"
  if (previousStatus === 'pending' && newStatus === 'in_progress') {
    try {
      // Access email field with type assertion (database path was corrected in .env)
      const requestWithEmail = existingRequest as typeof existingRequest & { email: string };
      
      await emailService.sendStatusUpdateEmail(
        requestWithEmail.email,
        requestWithEmail.full_name,
        requestId.toString(),
        newStatus
      );
      console.log(`📧 Status update email triggered for request #${requestId}`);
    } catch (error) {
      // Log error but don't fail the status update
      console.error(`❌ Failed to send status update email for request #${requestId}:`, error);
    }
  }

  res.json({
    success: true,
    message: 'בקשה עודכנה בהצלחה',
    data: updatedRequest
  });
}));

/**
 * DELETE /api/requests/:id - Delete tech request
 * מחיקת בקשת עזרה טכנית
 */
router.delete('/:id', asyncHandler(async (req, res) => {
  const requestId = parseInt(req.params.id);
  
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

  await prisma.techRequest.delete({
    where: { id: requestId }
  });

  res.json({
    success: true,
    message: 'בקשה נמחקה בהצלחה'
  });
}));

export default router;