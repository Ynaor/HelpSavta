import express from 'express';
import { prisma } from '../server';
import { validateBody, schemas } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';
import { requireAuth } from '../middleware/auth';

const router = express.Router();

/**
 * GET /api/slots - Get all available slots
 * קבלת כל השעות הזמינות
 */
router.get('/', asyncHandler(async (req, res) => {
  const { date, is_booked, page = 1, limit = 20 } = req.query;
  
  const where: any = {};
  if (date) where.date = date;
  if (is_booked !== undefined) where.is_booked = is_booked === 'true';

  const skip = (Number(page) - 1) * Number(limit);
  
  const [slots, total] = await Promise.all([
    prisma.availableSlot.findMany({
      where,
      orderBy: [
        { date: 'asc' },
        { start_time: 'asc' }
      ],
      skip,
      take: Number(limit),
      include: {
        tech_requests: true
      }
    }),
    prisma.availableSlot.count({ where })
  ]);

  res.json({
    success: true,
    data: slots,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit))
    }
  });
}));

/**
 * GET /api/slots/available - Get only available (not booked) slots
 * קבלת רק השעות הפנויות
 */
router.get('/available', asyncHandler(async (req, res) => {
  const { date } = req.query;
  
  const where: any = { is_booked: false };
  if (date) where.date = date;

  const slots = await prisma.availableSlot.findMany({
    where,
    orderBy: [
      { date: 'asc' },
      { start_time: 'asc' }
    ]
  });

  res.json({
    success: true,
    data: slots
  });
}));

/**
 * POST /api/slots - Create new available slot (Admin only)
 * יצירת שעה זמינה חדשה (למנהלים בלבד)
 */
router.post('/', requireAuth, validateBody(schemas.availableSlot), asyncHandler(async (req, res) => {
  const { date, start_time, end_time } = req.body;
  
  // Check if slot already exists
  const existingSlot = await prisma.availableSlot.findFirst({
    where: {
      date,
      start_time,
      end_time
    }
  });

  if (existingSlot) {
    return res.status(400).json({
      success: false,
      error: 'Slot already exists',
      message: 'השעה כבר קיימת במערכת'
    });
  }

  const slot = await prisma.availableSlot.create({
    data: req.body
  });

  res.status(201).json({
    success: true,
    message: 'שעה זמינה נוצרה בהצלחה',
    data: slot
  });
}));

/**
 * PUT /api/slots/:id/book - Book a slot for a request
 * הזמנת שעה לבקשה
 */
router.put('/:id/book', asyncHandler(async (req, res) => {
  const slotId = parseInt(req.params.id);
  const { request_id } = req.body;

  // Validate input
  if (!request_id) {
    return res.status(400).json({
      success: false,
      error: 'Request ID is required',
      message: 'נדרש מזהה בקשה'
    });
  }

  // Check if request exists and doesn't already have a slot
  const request = await prisma.techRequest.findUnique({
    where: { id: request_id },
    include: { booked_slot: true }
  });

  if (!request) {
    return res.status(404).json({
      success: false,
      error: 'Request not found',
      message: 'בקשה לא נמצאה'
    });
  }

  if (request.booked_slot_id) {
    return res.status(400).json({
      success: false,
      error: 'Request already has a booked slot',
      message: 'לבקשה כבר יש שעה מוזמנת'
    });
  }

  // Update slot and request in a transaction with race condition protection
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Check slot availability within transaction to prevent race conditions
      const slot = await tx.availableSlot.findUnique({
        where: { id: slotId }
      });

      if (!slot) {
        throw new Error('Slot not found');
      }

      if (slot.is_booked) {
        throw new Error('Slot already booked');
      }

      const updatedSlot = await tx.availableSlot.update({
        where: { id: slotId },
        data: { is_booked: true }
      });

      const updatedRequest = await tx.techRequest.update({
        where: { id: request_id },
        data: {
          booked_slot_id: slotId,
          scheduled_date: slot.date,
          scheduled_time: slot.start_time
        }
      });

      return { slot: updatedSlot, request: updatedRequest };
    });

    console.log(`✅ Slot ${slotId} successfully booked for request #${request_id}`);

    res.json({
      success: true,
      message: 'השעה הוזמנה בהצלחה',
      data: result
    });
  } catch (error: any) {
    if (error.message === 'Slot not found') {
      return res.status(404).json({
        success: false,
        error: 'Slot not found',
        message: 'השעה לא נמצאה'
      });
    } else if (error.message === 'Slot already booked') {
      return res.status(400).json({
        success: false,
        error: 'Slot already booked',
        message: 'השעה כבר תפוסה'
      });
    } else {
      throw error; // Re-throw unexpected errors
    }
  }
}));

/**
 * GET /api/slots/:id - Get slot by ID
 * קבלת שעה לפי מזהה
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const slotId = parseInt(req.params.id);
  
  const slot = await prisma.availableSlot.findUnique({
    where: { id: slotId },
    include: {
      tech_requests: true
    }
  });

  if (!slot) {
    return res.status(404).json({
      success: false,
      error: 'Slot not found',
      message: 'השעה לא נמצאה'
    });
  }

  res.json({
    success: true,
    data: slot
  });
}));

/**
 * PUT /api/slots/:id/release - Release a booked slot (Admin only)
 * שחרור שעה תפוסה (למנהלים בלבד)
 */
router.put('/:id/release', requireAuth, asyncHandler(async (req, res) => {
  const slotId = parseInt(req.params.id);
  
  // Get slot with related requests in a transaction
  const result = await prisma.$transaction(async (tx) => {
    // Find the slot
    const slot = await tx.availableSlot.findUnique({
      where: { id: slotId },
      include: {
        tech_requests: true
      }
    });

    if (!slot) {
      throw new Error('Slot not found');
    }

    if (!slot.is_booked) {
      throw new Error('Slot is not currently booked');
    }

    // Update all associated requests to clear their booked slot
    if (slot.tech_requests.length > 0) {
      await tx.techRequest.updateMany({
        where: {
          booked_slot_id: slotId
        },
        data: {
          booked_slot_id: null,
          scheduled_date: null,
          scheduled_time: null
        }
      });
    }

    // Update the slot to be available again
    const updatedSlot = await tx.availableSlot.update({
      where: { id: slotId },
      data: { is_booked: false }
    });

    return updatedSlot;
  });

  console.log(`✅ Slot ${slotId} successfully released`);

  res.json({
    success: true,
    message: 'השעה שוחררה בהצלחה',
    data: result
  });
}));

/**
 * DELETE /api/slots/:id - Delete available slot (Admin only)
 * מחיקת שעה זמינה (למנהלים בלבד)
 */
router.delete('/:id', requireAuth, asyncHandler(async (req, res) => {
  const slotId = parseInt(req.params.id);
  
  const slot = await prisma.availableSlot.findUnique({
    where: { id: slotId },
    include: { tech_requests: true }
  });

  if (!slot) {
    return res.status(404).json({
      success: false,
      error: 'Slot not found',
      message: 'השעה לא נמצאה'
    });
  }

  if (slot.is_booked && slot.tech_requests.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Cannot delete booked slot',
      message: 'לא ניתן למחוק שעה תפוסה'
    });
  }

  await prisma.availableSlot.delete({
    where: { id: slotId }
  });

  res.json({
    success: true,
    message: 'השעה נמחקה בהצלחה'
  });
}));

export default router;