import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Date formatting utilities for Hebrew locale
export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('he-IL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export function formatTime(time: string): string {
  return time;
}

export function formatDateTime(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleString('he-IL', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Phone number formatting
export function formatPhoneNumber(phone: string): string {
  // Format Israeli phone numbers: 050-123-4567
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10 && cleaned.startsWith('0')) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
}

// Validation utilities
export function isValidIsraeliPhone(phone: string): boolean {
  const phoneRegex = /^0[2-9]\d{7,8}$/;
  return phoneRegex.test(phone.replace(/\D/g, ''));
}

// Generate time slots
export function generateTimeSlots(
  startHour: number = 8,
  endHour: number = 18,
  intervalMinutes: number = 120
): Array<{ start_time: string; end_time: string }> {
  const slots = [];
  
  for (let hour = startHour; hour < endHour; hour += intervalMinutes / 60) {
    const startTime = `${Math.floor(hour).toString().padStart(2, '0')}:${((hour % 1) * 60).toString().padStart(2, '0')}`;
    const endHour = hour + intervalMinutes / 60;
    const endTime = `${Math.floor(endHour).toString().padStart(2, '0')}:${((endHour % 1) * 60).toString().padStart(2, '0')}`;
    
    slots.push({ start_time: startTime, end_time: endTime });
  }
  
  return slots;
}

// Date range generator
export function generateDateRange(
  startDate: Date,
  endDate: Date,
  excludeWeekends: boolean = false
): string[] {
  const dates: string[] = [];
  const current = new Date(startDate);
  
  while (current <= endDate) {
    if (!excludeWeekends || (current.getDay() !== 0 && current.getDay() !== 6)) {
      dates.push(current.toISOString().split('T')[0]);
    }
    current.setDate(current.getDate() + 1);
  }
  
  return dates;
}

// Hebrew day names
export const HEBREW_DAYS = {
  0: 'ראשון',
  1: 'שני',
  2: 'שלישי',
  3: 'רביעי',
  4: 'חמישי',
  5: 'שישי',
  6: 'שבת'
};

export function getHebrewDayName(date: Date): string {
  return HEBREW_DAYS[date.getDay() as keyof typeof HEBREW_DAYS];
}

// Error message formatter
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'אירעה שגיאה לא צפויה';
}