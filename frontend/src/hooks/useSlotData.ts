import { useState, useEffect, useCallback } from 'react';
import { AvailableSlot } from '../types';
import { slotsAPI } from '../services/api';
import { getErrorMessage } from '../lib/utils';

export interface UseSlotDataReturn {
  slots: AvailableSlot[];
  loading: boolean;
  error: string;
  refreshSlots: () => Promise<void>;
  clearError: () => void;
}

export const useSlotData = (autoRefresh: boolean = true): UseSlotDataReturn => {
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refreshSlots = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const result = await slotsAPI.getAll({ limit: 100 });
      setSlots(result || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError('');
  }, []);

  // Initial load
  useEffect(() => {
    refreshSlots();
  }, [refreshSlots]);

  // Auto-refresh mechanism
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      // Only auto-refresh if not currently loading
      if (!loading) {
        refreshSlots();
      }
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, loading, refreshSlots]);

  return {
    slots,
    loading,
    error,
    refreshSlots,
    clearError
  };
};

export default useSlotData;