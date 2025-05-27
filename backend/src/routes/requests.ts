import express from 'express';
import { prisma } from '../server';
import { validateBody, schemas } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';

const router = express.Router();

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
    data: req.body
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

  const updatedRequest = await prisma.techRequest.update({
    where: { id: requestId },
    data: req.body,
    include: {
      booked_slot: true
    }
  });

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