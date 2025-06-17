import React from 'react';
import { CalendarEvent as CalendarEventType, CALENDAR_EVENT_COLORS, STATUS_LABELS } from '../../types';
import { Clock, User, Phone, MapPin } from 'lucide-react';

interface CalendarEventProps {
  event: CalendarEventType;
  onClick?: (event: CalendarEventType) => void;
  className?: string;
  compact?: boolean;
}

const CalendarEvent: React.FC<CalendarEventProps> = ({
  event,
  onClick,
  className = '',
  compact = false
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClick) {
      onClick(event);
    }
  };

  const getEventColor = () => {
    if (event.type === 'request') {
      return CALENDAR_EVENT_COLORS.request[event.status as keyof typeof CALENDAR_EVENT_COLORS.request] || '#6b7280';
    } else {
      return CALENDAR_EVENT_COLORS.slot.available;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('he-IL', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const getStatusDisplay = () => {
    if (event.type === 'request' && event.status) {
      return STATUS_LABELS[event.status as keyof typeof STATUS_LABELS];
    }
    return event.type === 'slot' ? 'זמין' : '';
  };

  const eventColor = getEventColor();

  if (compact) {
    return (
      <div
        className={`
          p-1 rounded text-xs cursor-pointer transition-all duration-200 hover:shadow-sm
          border-r-2 flex flex-col justify-start ${className}
        `}
        style={{
          backgroundColor: `${eventColor}20`,
          borderRightColor: eventColor,
          color: eventColor,
          height: '100%'
        }}
        onClick={handleClick}
        title={`${event.title} - ${formatTime(event.start)} - ${formatTime(event.end)}`}
      >
        <div className="font-medium truncate">{event.title}</div>
        <div className="text-xs opacity-75 truncate">
          {formatTime(event.start)} - {formatTime(event.end)}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`
        p-2 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md
        border border-opacity-30 ${className}
      `}
      style={{ 
        backgroundColor: `${eventColor}15`,
        borderColor: eventColor
      }}
      onClick={handleClick}
    >
      {/* Event Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm truncate" style={{ color: eventColor }}>
            {event.title}
          </h4>
          {event.type === 'request' && event.customerName && (
            <p className="text-xs text-gray-600 truncate">
              {event.customerName}
            </p>
          )}
        </div>
        <span 
          className="px-2 py-1 rounded-full text-xs font-medium border mr-2 flex-shrink-0"
          style={{ 
            backgroundColor: `${eventColor}20`,
            borderColor: eventColor,
            color: eventColor
          }}
        >
          {getStatusDisplay()}
        </span>
      </div>

      {/* Time */}
      <div className="flex items-center space-x-reverse space-x-1 mb-2">
        <Clock className="w-3 h-3 text-gray-500" />
        <span className="text-xs text-gray-600">
          {formatTime(event.start)} - {formatTime(event.end)}
        </span>
      </div>

      {/* Additional Info for Requests */}
      {event.type === 'request' && (
        <div className="space-y-1">
          {event.assignee && (
            <div className="flex items-center space-x-reverse space-x-1">
              <User className="w-3 h-3 text-gray-500" />
              <span className="text-xs text-gray-600 truncate">
                {event.assignee}
                {event.assigneeRole === 'VOLUNTEER' && ' (מתנדב)'}
              </span>
            </div>
          )}
          
          {event.customerPhone && (
            <div className="flex items-center space-x-reverse space-x-1">
              <Phone className="w-3 h-3 text-gray-500" />
              <span className="text-xs text-gray-600 truncate">
                {event.customerPhone}
              </span>
            </div>
          )}
          
          {event.address && (
            <div className="flex items-center space-x-reverse space-x-1">
              <MapPin className="w-3 h-3 text-gray-500" />
              <span className="text-xs text-gray-600 truncate">
                {event.address}
              </span>
            </div>
          )}
          
          {event.description && (
            <div className="text-xs text-gray-600 mt-2 line-clamp-2">
              {event.description}
            </div>
          )}
        </div>
      )}

      {/* Urgency indicator for high priority requests */}
      {event.type === 'request' && (event.urgencyLevel === 'high' || event.urgencyLevel === 'urgent') && (
        <div className="flex items-center justify-end mt-2">
          <span className={`
            w-2 h-2 rounded-full
            ${event.urgencyLevel === 'urgent' ? 'bg-red-500 animate-pulse' : 'bg-orange-500'}
          `} />
        </div>
      )}
    </div>
  );
};

export default CalendarEvent;