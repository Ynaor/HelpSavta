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

  // Send request created email if user provided email
  if (request.email) {
    try {
      await emailService.sendRequestCreatedEmail(request);
      console.log(`📧 Request created email sent for request #${request.id}`);
    } catch (error) {
      // Log error but don't fail the request creation
      console.error(`❌ Failed to send request created email for request #${request.id}:`, error);
    }
  }

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
    where: { id: requestId },
    include: {
      booked_slot: true
    }
  });

  if (!existingRequest) {
    return res.status(404).json({
      success: false,
      error: 'Request not found',
      message: 'בקשה לא נמצאה'
    });
  }

  // Store previous status for email logic and slot management
  const previousStatus = existingRequest.status;
  const newStatus = req.body.status || previousStatus;

  // Handle slot lifecycle management based on status changes
  const result = await prisma.$transaction(async (tx) => {
    // Update the request
    const updatedRequest = await tx.techRequest.update({
      where: { id: requestId },
      data: req.body,
      include: {
        booked_slot: true
      }
    });

    // Handle slot lifecycle based on new status
    if (existingRequest.booked_slot_id) {
      if (newStatus === 'cancelled') {
        // Release the slot - make it available again
        await tx.availableSlot.update({
          where: { id: existingRequest.booked_slot_id },
          data: { is_booked: false }
        });

        // Clear the slot reference from the request
        await tx.techRequest.update({
          where: { id: requestId },
          data: {
            booked_slot_id: null,
            scheduled_date: null,
            scheduled_time: null
          }
        });

        console.log(`🔄 Slot ${existingRequest.booked_slot_id} released due to request #${requestId} cancellation`);
      } else if (newStatus === 'completed' || newStatus === 'done') {
        // Delete the slot completely for completed requests
        await tx.availableSlot.delete({
          where: { id: existingRequest.booked_slot_id }
        });

        console.log(`🗑️ Slot ${existingRequest.booked_slot_id} deleted due to request #${requestId} completion`);
      }
    }

    return updatedRequest;
  });

  // Send email notification when status changes from "pending" to "in_progress"
  if (previousStatus === 'pending' && newStatus === 'in_progress') {
    try {
      // Access email field with type assertion (database path was corrected in .env)
      const requestWithEmail = existingRequest as typeof existingRequest & { email: string };
      
      await emailService.sendStatusUpdateEmail(requestWithEmail, { id: 1, username: 'מנהל מערכת' });
      console.log(`📧 Status update email triggered for request #${requestId}`);
    } catch (error) {
      // Log error but don't fail the status update
      console.error(`❌ Failed to send status update email for request #${requestId}:`, error);
    }
  }

  res.json({
    success: true,
    message: 'בקשה עודכנה בהצלחה',
    data: result
  });
}));

/**
 * DELETE /api/requests/:id - Delete tech request
 * מחיקת בקשת עזרה טכנית
 */
router.delete('/:id', asyncHandler(async (req, res) => {
  const requestId = parseInt(req.params.id);
  
  const existingRequest = await prisma.techRequest.findUnique({
    where: { id: requestId },
    include: {
      booked_slot: true
    }
  });

  if (!existingRequest) {
    return res.status(404).json({
      success: false,
      error: 'Request not found',
      message: 'בקשה לא נמצאה'
    });
  }

  // Use transaction to ensure atomicity when releasing slot and deleting request
  await prisma.$transaction(async (tx) => {
    // If request has a booked slot, release it before deleting
    if (existingRequest.booked_slot_id) {
      await tx.availableSlot.update({
        where: { id: existingRequest.booked_slot_id },
        data: { is_booked: false }
      });

      console.log(`🔄 Slot ${existingRequest.booked_slot_id} released due to request #${requestId} deletion`);
    }

    // Delete the request
    await tx.techRequest.delete({
      where: { id: requestId }
    });
  });

  res.json({
    success: true,
    message: 'בקשה נמחקה בהצלחה'
  });
}));

export default router;