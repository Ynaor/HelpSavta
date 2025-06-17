import React from 'react';
import { CalendarEvent as CalendarEventType } from '../../types';
import CalendarGrid from './CalendarGrid';

interface WeeklyViewProps {
  events: CalendarEventType[];
  weekDays: Date[];
  onEventClick?: (event: CalendarEventType) => void;
  onTimeSlotClick?: (date: Date, time: string) => void;
  startHour?: number;
  endHour?: number;
  loading?: boolean;
  className?: string;
}

const WeeklyView: React.FC<WeeklyViewProps> = ({
  events,
  weekDays,
  onEventClick,
  onTimeSlotClick,
  startHour = 8,
  endHour = 18,
  loading = false,
  className = ''
}) => {
  if (loading) {
    return (
      <div className={`bg-white border border-gray-200 rounded-lg p-8 ${className}`}>
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">טוען נתוני לוח שנה...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      {/* Week overview - summary info */}
      <div className="mb-4 bg-white border border-gray-200 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {events.filter(e => e.type === 'request' && e.status === 'pending').length}
            </div>
            <div className="text-gray-600">בקשות ממתינות</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {events.filter(e => e.type === 'request' && e.status === 'in_progress').length}
            </div>
            <div className="text-gray-600">בקשות בטיפול</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {events.filter(e => e.type === 'request' && e.status === 'completed').length}
            </div>
            <div className="text-gray-600">בקשות שהושלמו</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">
              {events.filter(e => e.type === 'slot' && !e.isBooked).length}
            </div>
            <div className="text-gray-600">זמנים פנויים</div>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <CalendarGrid
        events={events}
        weekDays={weekDays}
        onEventClick={onEventClick}
        onTimeSlotClick={onTimeSlotClick}
        startHour={startHour}
        endHour={endHour}
      />

      {/* Week summary */}
      <div className="mt-4 bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">סיכום השבוע</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {weekDays.map((day, index) => {
            const dayEvents = events.filter(event => {
              const eventDate = new Date(event.start);
              return eventDate.toDateString() === day.toDateString();
            });

            const dayRequests = dayEvents.filter(e => e.type === 'request');
            const daySlots = dayEvents.filter(e => e.type === 'slot');

            return (
              <div key={index} className="text-center p-2 bg-gray-50 rounded">
                <div className="font-medium text-gray-800 mb-1">
                  {day.toLocaleDateString('he-IL', { weekday: 'short', day: 'numeric' })}
                </div>
                <div className="space-y-1">
                  <div className="text-blue-600">
                    {dayRequests.length} בקשות
                  </div>
                  <div className="text-gray-600">
                    {daySlots.length} זמנים
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Empty state */}
      {events.length === 0 && (
        <div className="text-center py-12 bg-white border border-gray-200 rounded-lg mt-4">
          <div className="text-gray-400 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">אין אירועים השבוע</h3>
          <p className="text-gray-600">לא נמצאו בקשות או זמנים פנויים בטווח הנבחר</p>
        </div>
      )}
    </div>
  );
};

export default WeeklyView;