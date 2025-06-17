import React from 'react';
import { ChevronLeft, ChevronRight, Calendar, RotateCcw } from 'lucide-react';
import { Button } from '../ui/button';
import { CalendarView, CALENDAR_LABELS } from '../../types';

interface CalendarHeaderProps {
  currentDate: Date;
  view: CalendarView;
  displayDate: string;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
  onViewChange: (view: CalendarView) => void;
  onDateSelect?: (date: Date) => void;
  loading?: boolean;
}

const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  currentDate,
  view,
  displayDate,
  onPrevious,
  onNext,
  onToday,
  onViewChange,
  onDateSelect,
  loading = false
}) => {
  const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDate = new Date(e.target.value);
    if (!isNaN(selectedDate.getTime()) && onDateSelect) {
      onDateSelect(selectedDate);
    }
  };

  const formatDateForInput = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  const isToday = (): boolean => {
    const today = new Date();
    return currentDate.toDateString() === today.toDateString();
  };

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left side - Navigation */}
        <div className="flex items-center space-x-reverse space-x-4">
          {/* Today Button */}
          <Button
            variant={isToday() ? "default" : "outline"}
            size="sm"
            onClick={onToday}
            disabled={loading}
            className="flex items-center space-x-reverse space-x-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{CALENDAR_LABELS.today}</span>
          </Button>

          {/* Navigation Arrows */}
          <div className="flex items-center space-x-reverse space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onPrevious}
              disabled={loading}
              className="p-2"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onNext}
              disabled={loading}
              className="p-2"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </div>

          {/* Date Display */}
          <div className="flex items-center space-x-reverse space-x-2">
            <h2 className="text-xl font-semibold text-gray-900">
              {displayDate}
            </h2>
            {loading && (
              <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full" />
            )}
          </div>
        </div>

        {/* Right side - View controls and date picker */}
        <div className="flex items-center space-x-reverse space-x-4">
          {/* Date Picker */}
          {onDateSelect && (
            <div className="relative">
              <input
                type="date"
                value={formatDateForInput(currentDate)}
                onChange={handleDateInputChange}
                className="sr-only"
                id="calendar-date-picker"
              />
              <label
                htmlFor="calendar-date-picker"
                className="cursor-pointer flex items-center space-x-reverse space-x-2 px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-700">בחר תאריך</span>
              </label>
            </div>
          )}

          {/* View Toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <Button
              variant={view === 'week' ? "default" : "ghost"}
              size="sm"
              onClick={() => onViewChange('week')}
              disabled={loading}
              className="px-3 py-1 text-sm"
            >
              {CALENDAR_LABELS.week}
            </Button>
            <Button
              variant={view === 'month' ? "default" : "ghost"}
              size="sm"
              onClick={() => onViewChange('month')}
              disabled={loading}
              className="px-3 py-1 text-sm"
            >
              {CALENDAR_LABELS.month}
            </Button>
          </div>
        </div>
      </div>

      {/* Secondary row for additional info (if needed) */}
      <div className="mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center space-x-reverse space-x-4">
            <span>תצוגת {view === 'week' ? 'שבוע' : 'חודש'}</span>
            {view === 'week' && (
              <span>שעות: 08:00 - 18:00</span>
            )}
          </div>
          
          {/* Legend */}
          <div className="flex items-center space-x-reverse space-x-4 text-xs">
            <div className="flex items-center space-x-reverse space-x-1">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span>בטיפול</span>
            </div>
            <div className="flex items-center space-x-reverse space-x-1">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span>ממתין</span>
            </div>
            <div className="flex items-center space-x-reverse space-x-1">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span>הושלם</span>
            </div>
            <div className="flex items-center space-x-reverse space-x-1">
              <div className="w-3 h-3 rounded-full bg-gray-500"></div>
              <span>זמין</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarHeader;