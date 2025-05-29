// Type definitions matching the backend schema

export interface TechRequest {
  id: number;
  full_name: string;
  phone: string;
  email: string;
  address: string;
  problem_description: string;
  urgency_level: 'low' | 'medium' | 'high' | 'urgent';
  scheduled_date?: string;
  scheduled_time?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
  assigned_admin_id?: number;
  assigned_admin?: AdminUser;
  created_at: string;
  updated_at: string;
  booked_slot?: AvailableSlot;
  booked_slot_id?: number;
}

export interface AvailableSlot {
  id: number;
  date: string;
  start_time: string;
  end_time: string;
  is_booked: boolean;
  created_at: string;
  updated_at: string;
  tech_requests?: TechRequest[];
}

export interface AdminUser {
  id: number;
  username: string;
  role?: 'SYSTEM_ADMIN' | 'VOLUNTEER';
  is_active?: boolean;
  created_at: string;
  updated_at: string;
  created_by?: number;
}

export interface NotificationLog {
  id: number;
  type: string;
  recipient: string;
  message: string;
  sent_at: string;
  status: 'pending' | 'sent' | 'failed';
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Form types
export interface CreateTechRequestForm {
  full_name: string;
  phone: string;
  email: string;
  address: string;
  problem_description: string;
  urgency_level: 'low' | 'medium' | 'high' | 'urgent';
  notes?: string;
}

export interface CreateSlotForm {
  date: string;
  start_time: string;
  end_time: string;
}

export interface LoginForm {
  username: string;
  password: string;
}

export interface UpdateRequestForm {
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
  scheduled_date?: string;
  scheduled_time?: string;
}

// Dashboard statistics
export interface DashboardStats {
  statistics: {
    requests: {
      total: number;
      pending: number;
      in_progress: number;
      completed: number;
      cancelled: number;
    };
    slots: {
      total: number;
      available: number;
      booked: number;
    };
  };
  recentRequests: TechRequest[];
  inProgressRequests: TechRequest[];
}

// Hebrew labels for status and urgency
export const STATUS_LABELS: Record<TechRequest['status'], string> = {
  pending: 'ממתין',
  in_progress: 'בטיפול',
  completed: 'הושלם',
  cancelled: 'בוטל'
};

export const URGENCY_LABELS: Record<TechRequest['urgency_level'], string> = {
  low: 'נמוכה',
  medium: 'בינונית',
  high: 'גבוהה',
  urgent: 'דחוף'
};

// Admin form types
export interface CreateAdminForm {
  username: string;
  password: string;
}

// Admin request update interface
export interface AdminRequestUpdateForm {
  full_name?: string;
  phone?: string;
  email?: string;
  address?: string;
  problem_description?: string;
  urgency_level?: 'low' | 'medium' | 'high' | 'urgent';
  scheduled_date?: string;
  scheduled_time?: string;
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
}

// Take request interface
export interface TakeRequestForm {
  notes?: string;
}

// Slot lifecycle operation results
export interface SlotOperationResult {
  slot: AvailableSlot;
  request?: TechRequest;
  message: string;
}

// Comprehensive data for admin panel
export interface ComprehensiveAdminData {
  requests: TechRequest[];
  slots: AvailableSlot[];
  stats: DashboardStats;
}

// Enhanced error handling types
export interface ApiError {
  success: false;
  error: string;
  message?: string;
  details?: Array<{
    field: string;
    message: string;
  }>;
}

// Slot lifecycle events for real-time updates
export type SlotLifecycleEvent =
  | 'slot_released'    // When a request is cancelled/deleted
  | 'slot_deleted'     // When a request is completed
  | 'slot_booked'      // When a slot is booked
  | 'slot_created';    // When a new slot is created

export interface SlotLifecycleNotification {
  event: SlotLifecycleEvent;
  slotId: number;
  requestId?: number;
  message: string;
  timestamp: string;
}

// Calendar types
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

export interface CalendarDataResponse {
  events: CalendarEvent[];
  view: string;
  dateRange: {
    start: string;
    end: string;
  };
  userRole: 'SYSTEM_ADMIN' | 'VOLUNTEER';
}

export interface CalendarQueryParams {
  startDate: string;
  endDate: string;
  view?: 'week' | 'month';
}

// Calendar view types
export type CalendarView = 'week' | 'month';

// Calendar event colors based on type and status
export const CALENDAR_EVENT_COLORS = {
  request: {
    pending: '#f59e0b',     // amber
    in_progress: '#3b82f6', // blue
    completed: '#10b981',   // green
    cancelled: '#ef4444'    // red
  },
  slot: {
    available: '#6b7280'    // gray
  }
} as const;

// Hebrew labels for calendar
export const CALENDAR_LABELS = {
  today: 'היום',
  month: 'חודש',
  week: 'שבוע',
  day: 'יום',
  agenda: 'סדר יום',
  noEventsInRange: 'אין אירועים בטווח זה',
  showMore: (count: number) => `+${count} נוספים`,
  previous: 'קודם',
  next: 'הבא',
  yesterday: 'אתמול',
  tomorrow: 'מחר',
  allDay: 'כל היום'
} as const;