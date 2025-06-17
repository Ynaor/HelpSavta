import { useState, useCallback, useMemo } from 'react';
import { CalendarView } from '../types';

interface UseCalendarNavigationResult {
  currentDate: Date;
  view: CalendarView;
  weekStart: Date;
  weekEnd: Date;
  monthStart: Date;
  monthEnd: Date;
  displayDateRange: { start: string; end: string };
  goToPreviousWeek: () => void;
  goToNextWeek: () => void;
  goToPreviousMonth: () => void;
  goToNextMonth: () => void;
  goToToday: () => void;
  goToDate: (date: Date) => void;
  setView: (view: CalendarView) => void;
  getWeekDays: () => Date[];
  formatDisplayDate: () => string;
}

const getWeekStart = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = -day; // This will make Sunday the start
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

const getWeekEnd = (date: Date): Date => {
  const weekStart = getWeekStart(date);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  return weekEnd;
};

const getMonthStart = (date: Date): Date => {
  const d = new Date(date.getFullYear(), date.getMonth(), 1);
  d.setHours(0, 0, 0, 0);
  return d;
};

const getMonthEnd = (date: Date): Date => {
  const d = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  d.setHours(23, 59, 59, 999);
  return d;
};

const formatDateForAPI = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const useCalendarNavigation = (initialDate?: Date, initialView: CalendarView = 'week'): UseCalendarNavigationResult => {
  const [currentDate, setCurrentDate] = useState(initialDate || new Date());
  const [view, setView] = useState<CalendarView>(initialView);

  // Calculate date ranges
  const weekStart = useMemo(() => getWeekStart(currentDate), [currentDate]);
  const weekEnd = useMemo(() => getWeekEnd(currentDate), [currentDate]);
  const monthStart = useMemo(() => getMonthStart(currentDate), [currentDate]);
  const monthEnd = useMemo(() => getMonthEnd(currentDate), [currentDate]);

  // Get display date range based on current view
  const displayDateRange = useMemo(() => {
    console.log('📊 [Navigation] Calculating display date range:', {
      currentDate,
      view,
      weekStart: formatDateForAPI(weekStart),
      weekEnd: formatDateForAPI(weekEnd)
    });
    
    if (view === 'week') {
      const range = {
        start: formatDateForAPI(weekStart),
        end: formatDateForAPI(weekEnd)
      };
      console.log('📅 [Navigation] Week range calculated:', range);
      return range;
    } else {
      const range = {
        start: formatDateForAPI(monthStart),
        end: formatDateForAPI(monthEnd)
      };
      console.log('📅 [Navigation] Month range calculated:', range);
      return range;
    }
  }, [view, weekStart, weekEnd, monthStart, monthEnd]);

  // Navigation functions
  const goToPreviousWeek = useCallback(() => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setDate(prev.getDate() - 7);
      return newDate;
    });
  }, []);

  const goToNextWeek = useCallback(() => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setDate(prev.getDate() + 7);
      return newDate;
    });
  }, []);

  const goToPreviousMonth = useCallback(() => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() - 1);
      return newDate;
    });
  }, []);

  const goToNextMonth = useCallback(() => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + 1);
      return newDate;
    });
  }, []);

  const goToToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  const goToDate = useCallback((date: Date) => {
    setCurrentDate(new Date(date));
  }, []);

  // Get week days for week view
  const getWeekDays = useCallback((): Date[] => {
    const days: Date[] = [];
    const start = getWeekStart(currentDate);
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      days.push(day);
    }
    
    return days;
  }, [currentDate]);

  // Format display date for header
  const formatDisplayDate = useCallback((): string => {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: view === 'week' ? 'numeric' : undefined
    };

    if (view === 'week') {
      const endDate = new Date(weekStart);
      endDate.setDate(weekStart.getDate() + 6);
      
      // Check if week spans multiple months
      if (weekStart.getMonth() !== endDate.getMonth()) {
        return `${weekStart.toLocaleDateString('he-IL', { day: 'numeric', month: 'short' })} - ${endDate.toLocaleDateString('he-IL', { day: 'numeric', month: 'short', year: 'numeric' })}`;
      } else {
        return `${weekStart.toLocaleDateString('he-IL', { day: 'numeric' })} - ${endDate.toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })}`;
      }
    } else {
      return currentDate.toLocaleDateString('he-IL', options);
    }
  }, [currentDate, view, weekStart]);

  return {
    currentDate,
    view,
    weekStart,
    weekEnd,
    monthStart,
    monthEnd,
    displayDateRange,
    goToPreviousWeek,
    goToNextWeek,
    goToPreviousMonth,
    goToNextMonth,
    goToToday,
    goToDate,
    setView,
    getWeekDays,
    formatDisplayDate
  };
};