import { useState, useEffect, useCallback } from 'react';
import { CalendarDataResponse, CalendarQueryParams, CalendarEvent } from '../types';
import { adminAPI } from '../services/api';
import { getErrorMessage } from '../lib/utils';

interface UseCalendarDataResult {
  data: CalendarDataResponse | null;
  events: CalendarEvent[];
  loading: boolean;
  error: string | null;
  userRole: 'SYSTEM_ADMIN' | 'VOLUNTEER' | null;
  refreshData: () => Promise<void>;
  loadDataForDateRange: (startDate: string, endDate: string, view?: 'week' | 'month') => Promise<void>;
}

export const useCalendarData = (initialParams?: CalendarQueryParams): UseCalendarDataResult => {
  const [data, setData] = useState<CalendarDataResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async (params: CalendarQueryParams) => {
    try {
      console.log('🔄 [Calendar] Loading data with params:', params);
      setLoading(true);
      setError(null);
      const response = await adminAPI.getCalendarData(params);
      console.log('✅ [Calendar] Data loaded successfully:', {
        eventsCount: response.events?.length || 0,
        userRole: response.userRole,
        dateRange: response.dateRange
      });
      setData(response);
    } catch (err) {
      console.error('❌ [Calendar] Error loading calendar data:', err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const loadDataForDateRange = useCallback(async (
    startDate: string, 
    endDate: string, 
    view: 'week' | 'month' = 'week'
  ) => {
    await loadData({ startDate, endDate, view });
  }, [loadData]);

  const refreshData = useCallback(async () => {
    if (data?.dateRange) {
      await loadData({
        startDate: data.dateRange.start,
        endDate: data.dateRange.end,
        view: data.view as 'week' | 'month'
      });
    }
  }, [data, loadData]);

  // Initial load
  useEffect(() => {
    if (initialParams) {
      loadData(initialParams);
    }
  }, [initialParams, loadData]);

  return {
    data,
    events: data?.events || [],
    loading,
    error,
    userRole: data?.userRole || null,
    refreshData,
    loadDataForDateRange
  };
};