import React, { useMemo } from 'react';
import { CalendarEvent as CalendarEventType } from '../../types';
import CalendarEvent from './CalendarEvent';

interface CalendarGridProps {
  events: CalendarEventType[];
  weekDays: Date[];
  onEventClick?: (event: CalendarEventType) => void;
  onTimeSlotClick?: (date: Date, time: string) => void;
  startHour?: number;
  endHour?: number;
  className?: string;
}

const CalendarGrid: React.FC<CalendarGridProps> = ({
  events,
  weekDays,
  onEventClick,
  onTimeSlotClick,
  startHour = 8,
  endHour = 18,
  className = ''
}) => {
  // Generate time slots
  const timeSlots = useMemo(() => {
    const slots: string[] = [];
    for (let hour = startHour; hour <= endHour; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      if (hour < endHour) {
        slots.push(`${hour.toString().padStart(2, '0')}:30`);
      }
    }
    return slots;
  }, [startHour, endHour]);

  // Group events by date and time
  const eventsByDateAndTime = useMemo(() => {
    const grouped: { [key: string]: CalendarEventType[] } = {};
    
    events.forEach(event => {
      const eventDate = new Date(event.start);
      // Use local date string to avoid UTC conversion
      const year = eventDate.getFullYear();
      const month = String(eventDate.getMonth() + 1).padStart(2, '0');
      const day = String(eventDate.getDate()).padStart(2, '0');
      const dateKey = `${year}-${month}-${day}`;
      
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(event);
    });
    
    return grouped;
  }, [events]);

  // Get events for a specific date and time slot
  const getEventsForSlot = (date: Date, timeSlot: string): CalendarEventType[] => {
    // Use local date string to avoid UTC conversion
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateKey = `${year}-${month}-${day}`;
    const dayEvents = eventsByDateAndTime[dateKey] || [];
    
    return dayEvents.filter(event => {
      const eventStart = new Date(event.start);
      
      // Check if the event starts in this time slot
      const eventStartHour = eventStart.getHours();
      const eventStartMinute = eventStart.getMinutes();
      const slotHour = parseInt(timeSlot.split(':')[0]);
      const slotMinute = parseInt(timeSlot.split(':')[1]);
      
      return eventStartHour === slotHour && eventStartMinute === slotMinute;
    });
  };

  // Check if a time slot is occupied by a spanning event from earlier
  const isSlotOccupiedBySpanningEvent = (date: Date, timeSlot: string): boolean => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateKey = `${year}-${month}-${day}`;
    const dayEvents = eventsByDateAndTime[dateKey] || [];
    
    const slotTime = new Date(`${dateKey}T${timeSlot}:00`);
    
    return dayEvents.some(event => {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);
      
      // Check if this slot falls within an event's duration (but not its start)
      return eventStart < slotTime && eventEnd > slotTime;
    });
  };

  // Get the grid row span for an event (how many time slots it spans)
  const getEventGridRowSpan = (event: CalendarEventType): number => {
    const eventStart = new Date(event.start);
    const eventEnd = new Date(event.end);
    const durationMs = eventEnd.getTime() - eventStart.getTime();
    const durationMinutes = durationMs / (1000 * 60);
    return Math.ceil(durationMinutes / 30);
  };


  const handleTimeSlotClick = (date: Date, timeSlot: string) => {
    if (onTimeSlotClick) {
      onTimeSlotClick(date, timeSlot);
    }
  };

  const isCurrentTimeSlot = (date: Date, timeSlot: string): boolean => {
    const now = new Date();
    const slotDate = new Date(`${date.toISOString().split('T')[0]}T${timeSlot}:00`);
    const slotEndDate = new Date(slotDate.getTime() + 30 * 60 * 1000);
    
    return now >= slotDate && now < slotEndDate;
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const formatDayHeader = (date: Date): string => {
    return date.toLocaleDateString('he-IL', { 
      weekday: 'short', 
      day: 'numeric',
      month: 'short'
    });
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg overflow-hidden ${className}`}>
      {/* Grid Container */}
      <div className="grid grid-cols-8 min-h-0">
        {/* Time column header */}
        <div className="bg-gray-50 border-b border-gray-200 p-3">
          <div className="text-sm font-medium text-gray-700 text-center">זמן</div>
        </div>

        {/* Day headers */}
        {weekDays.map((day, index) => (
          <div
            key={index}
            className={`
              bg-gray-50 border-b border-gray-200 p-3 text-center
              ${index < weekDays.length - 1 ? 'border-l border-gray-200' : ''}
              ${isToday(day) ? 'bg-blue-50 border-blue-200' : ''}
            `}
          >
            <div className={`text-sm font-medium ${isToday(day) ? 'text-blue-700' : 'text-gray-700'}`}>
              {formatDayHeader(day)}
            </div>
          </div>
        ))}

        {/* Time slots */}
        {timeSlots.map((timeSlot) => (
          <React.Fragment key={timeSlot}>
            {/* Time label */}
            <div className="bg-gray-50 border-b border-gray-200 p-2 border-l border-gray-200">
              <div className="text-xs text-gray-600 text-center font-mono">
                {timeSlot}
              </div>
            </div>

            {/* Day columns */}
            {weekDays.map((day, dayIndex) => {
              const isCurrentSlot = isCurrentTimeSlot(day, timeSlot);
              const isTodayColumn = isToday(day);
              const eventsInSlot = getEventsForSlot(day, timeSlot);
              const isOccupiedBySpanning = isSlotOccupiedBySpanningEvent(day, timeSlot);
              const isEmpty = eventsInSlot.length === 0 && !isOccupiedBySpanning;

              return (
                <div
                  key={`${day.toISOString()}-${timeSlot}`}
                  className={`
                    relative h-[60px] border-b border-gray-200 p-1
                    ${dayIndex < weekDays.length - 1 ? 'border-l border-gray-200' : ''}
                    ${isTodayColumn ? 'bg-blue-25' : 'bg-white'}
                    ${isCurrentSlot ? 'bg-yellow-50 border-yellow-200' : ''}
                    ${isEmpty ? 'hover:bg-gray-50 transition-colors cursor-pointer' : ''}
                    ${isOccupiedBySpanning ? 'opacity-0' : ''}
                  `}
                  onClick={isEmpty ? () => handleTimeSlotClick(day, timeSlot) : undefined}
                  data-time-slot={timeSlot}
                  data-day-index={dayIndex}
                >
                  {/* Current time indicator
                  {isCurrentSlot && !isOccupiedBySpanning && (
                    <div className="absolute top-0 left-0 right-0 h-1 bg-red-500 z-10"></div>
                  )} */}

                  {/* Events in this slot - only render if not occupied by spanning */}
                  {!isOccupiedBySpanning && eventsInSlot.map((event, eventIndex) => {
                    const eventHeight = getEventGridRowSpan(event);
                    return (
                      <div
                        key={`${event.id}-${eventIndex}`}
                        className="absolute inset-1"
                        style={{
                          height: `${eventHeight * 60 - 8}px`,
                          zIndex: 20
                        }}
                      >
                        <CalendarEvent
                          event={event}
                          onClick={onEventClick}
                          compact={true}
                          className="text-xs h-full"
                        />
                      </div>
                    );
                  })}

                  {/* Empty slot indicator */}
                  {isEmpty && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <div className="text-xs text-gray-400">+</div>
                    </div>
                  )}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>

      {/* All-day events section (if any) */}
      {events.some(event => {
        const start = new Date(event.start);
        const end = new Date(event.end);
        return (end.getTime() - start.getTime()) >= 24 * 60 * 60 * 1000; // 24 hours or more
      }) && (
        <div className="border-t border-gray-200 bg-gray-50 p-3">
          <div className="text-sm font-medium text-gray-700 mb-2">אירועים של כל היום</div>
          <div className="space-y-1">
            {events
              .filter(event => {
                const start = new Date(event.start);
                const end = new Date(event.end);
                return (end.getTime() - start.getTime()) >= 24 * 60 * 60 * 1000;
              })
              .map(event => (
                <CalendarEvent
                  key={event.id}
                  event={event}
                  onClick={onEventClick}
                  compact={true}
                />
              ))
            }
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarGrid;