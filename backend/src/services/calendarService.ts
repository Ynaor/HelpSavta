import { prisma } from '../server';
import { ADMIN_ROLES } from '../types/adminRoles';

/**
 * Calendar Event interface
 * ממשק אירוע לוח שנה
 */
export interface CalendarEvent {
  id: string;
  type: 'request' | 'slot';
  title: string;
  start: string; // ISO datetime string
  end: string;   // ISO datetime string
  status: string;
  urgencyLevel?: string;
  assignee?: string;
  assigneeRole?: string;
  requestId?: number;
  slotId?: number;
  customerName?: string;
  customerPhone?: string;
  address?: string;
  description?: string;
  notes?: string | null;
  isBooked?: boolean;
}

/**
 * Get calendar data for system administrators
 * קבלת נתוני לוח שנה עבור מנהלי מערכת
 */
export async function getSystemAdminCalendarData(startDate: string, endDate: string): Promise<CalendarEvent[]> {
  const events: CalendarEvent[] = [];

  // Get all tech requests with scheduled dates in the range
  const requests = await prisma.techRequest.findMany({
    where: {
      scheduled_date: {
        gte: startDate,
        lte: endDate
      }
    },
    include: {
      booked_slot: true,
      assigned_admin: {
        select: {
          id: true,
          username: true,
          role: true
        }
      }
    },
    orderBy: {
      scheduled_date: 'asc'
    }
  });

  // Convert requests to calendar events
  for (const request of requests) {
    if (request.scheduled_date && request.scheduled_time) {
      const startDateTime = `${request.scheduled_date}T${request.scheduled_time}:00+03:00`;
      const endDateTime = `${request.scheduled_date}T${addHoursToTime(request.scheduled_time, 1)}:00+03:00`;

      events.push({
        id: `request-${request.id}`,
        type: 'request',
        title: `${request.full_name} - ${request.problem_description.substring(0, 50)}...`,
        start: startDateTime,
        end: endDateTime,
        status: request.status,
        urgencyLevel: request.urgency_level,
        assignee: request.assigned_admin?.username || 'לא מוקצה',
        assigneeRole: request.assigned_admin?.role,
        requestId: request.id,
        customerName: request.full_name,
        customerPhone: request.phone,
        address: request.address,
        description: request.problem_description,
        notes: request.notes
      });
    }
  }

  // Get all available slots in the date range that are not booked
  const availableSlots = await prisma.availableSlot.findMany({
    where: {
      date: {
        gte: startDate,
        lte: endDate
      },
      is_booked: false
    },
    orderBy: {
      date: 'asc'
    }
  });

  // Convert available slots to calendar events
  for (const slot of availableSlots) {
    const startDateTime = `${slot.date}T${slot.start_time}:00+03:00`;
    const endDateTime = `${slot.date}T${slot.end_time}:00+03:00`;

    events.push({
      id: `slot-${slot.id}`,
      type: 'slot',
      title: `זמן פנוי: ${slot.start_time} - ${slot.end_time}`,
      start: startDateTime,
      end: endDateTime,
      status: 'available',
      slotId: slot.id,
      isBooked: slot.is_booked
    });
  }

  return events;
}

/**
 * Get calendar data for volunteers (only their assigned requests)
 * קבלת נתוני לוח שנה עבור מתנדבים (רק הבקשות המוקצות להם)
 */
export async function getVolunteerCalendarData(adminId: number, startDate: string, endDate: string): Promise<CalendarEvent[]> {
  const events: CalendarEvent[] = [];

  // Get only requests assigned to this volunteer
  const requests = await prisma.techRequest.findMany({
    where: {
      assigned_admin_id: adminId,
      scheduled_date: {
        gte: startDate,
        lte: endDate
      }
    },
    include: {
      booked_slot: true
    },
    orderBy: {
      scheduled_date: 'asc'
    }
  });

  // Convert requests to calendar events
  for (const request of requests) {
    if (request.scheduled_date && request.scheduled_time) {
      const startDateTime = `${request.scheduled_date}T${request.scheduled_time}:00+03:00`;
      const endDateTime = `${request.scheduled_date}T${addHoursToTime(request.scheduled_time, 1)}:00+03:00`;

      events.push({
        id: `request-${request.id}`,
        type: 'request',
        title: `${request.full_name} - ${request.problem_description.substring(0, 50)}...`,
        start: startDateTime,
        end: endDateTime,
        status: request.status,
        urgencyLevel: request.urgency_level,
        requestId: request.id,
        customerName: request.full_name,
        customerPhone: request.phone,
        address: request.address,
        description: request.problem_description,
        notes: request.notes
      });
    }
  }

  return events;
}

/**
 * Get calendar data based on user role
 * קבלת נתוני לוח שנה על בסיס תפקיד המשתמש
 */
export async function getCalendarData(
  userId: number, 
  userRole: string, 
  startDate: string, 
  endDate: string
): Promise<CalendarEvent[]> {
  if (userRole === ADMIN_ROLES.SYSTEM_ADMIN) {
    return await getSystemAdminCalendarData(startDate, endDate);
  } else {
    return await getVolunteerCalendarData(userId, startDate, endDate);
  }
}

/**
 * Helper function to add hours to a time string
 * פונקציית עזר להוספת שעות למחרוזת זמן
 */
function addHoursToTime(timeString: string, hours: number): string {
  const [hourStr, minuteStr] = timeString.split(':');
  
  if (!hourStr || !minuteStr) {
    throw new Error('Invalid time format');
  }
  
  const hour = parseInt(hourStr, 10) + hours;
  const minute = parseInt(minuteStr, 10);
  
  // Handle hour overflow
  const finalHour = hour >= 24 ? hour - 24 : hour;
  
  return `${finalHour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
}

/**
 * Validate date format (YYYY-MM-DD)
 * בדיקת פורמט תאריך
 */
export function isValidDateFormat(dateString: string): boolean {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  return dateRegex.test(dateString);
}

/**
 * Validate date range
 * בדיקת טווח תאריכים
 */
export function validateDateRange(startDate: string, endDate: string): { isValid: boolean; error?: string } {
  if (!isValidDateFormat(startDate) || !isValidDateFormat(endDate)) {
    return {
      isValid: false,
      error: 'פורמט תאריך לא תקין. נדרש פורמט: YYYY-MM-DD'
    };
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (start > end) {
    return {
      isValid: false,
      error: 'תאריך התחלה חייב להיות לפני תאריך הסיום'
    };
  }

  // Check if date range is not too large (e.g., more than 1 year)
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays > 365) {
    return {
      isValid: false,
      error: 'טווח התאריכים גדול מדי (מקסימום שנה)'
    };
  }

  return { isValid: true };
}