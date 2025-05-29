import express from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { requireAnyAdmin } from '../middleware/auth';
import { getCalendarData, validateDateRange } from '../services/calendarService';

const router = express.Router();

/**
 * GET /api/admin/calendar-data - Get calendar data based on user role
 * קבלת נתוני לוח שנה על בסיס תפקיד המשתמש
 */
router.get('/calendar-data', requireAnyAdmin, asyncHandler(async (req, res) => {
  const { startDate, endDate, view = 'month' } = req.query;
  const userId = req.session.userId!;
  const userRole = req.session.role!;

  // Validate required parameters
  if (!startDate || !endDate) {
    return res.status(400).json({
      success: false,
      error: 'Missing required parameters',
      message: 'חסרים פרמטרים נדרשים: startDate ו-endDate'
    });
  }

  // Validate date range
  const validation = validateDateRange(startDate as string, endDate as string);
  if (!validation.isValid) {
    return res.status(400).json({
      success: false,
      error: 'Invalid date range',
      message: validation.error
    });
  }

  try {
    const calendarEvents = await getCalendarData(
      userId,
      userRole,
      startDate as string,
      endDate as string
    );

    res.json({
      success: true,
      data: {
        events: calendarEvents,
        view,
        dateRange: {
          start: startDate as string,
          end: endDate as string
        },
        userRole
      }
    });
  } catch (error) {
    console.error('Error fetching calendar data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch calendar data',
      message: 'שגיאה בקבלת נתוני לוח השנה'
    });
  }
}));

export default router;