import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AlertCircle } from 'lucide-react';
import { CalendarEvent as CalendarEventType, TechRequest } from '../../types';
import { useCalendarData } from '../../hooks/useCalendarData';
import { useCalendarNavigation } from '../../hooks/useCalendarNavigation';
import CalendarHeader from '../../components/calendar/CalendarHeader';
import CalendarControls, { CalendarFilters } from '../../components/calendar/CalendarControls';
import WeeklyView from '../../components/calendar/WeeklyView';
import RequestDetailsModal from '../../components/requests/RequestDetailsModal';
import { Button } from '../../components/ui/button';
import { getErrorMessage } from '../../lib/utils';

const CalendarView: React.FC = () => {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEventType | null>(null);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<TechRequest | null>(null);
  const [filters, setFilters] = useState<CalendarFilters>({});

  // Calendar navigation
  const navigation = useCalendarNavigation(new Date(), 'week');

  // Calendar data
  const calendarData = useCalendarData();

  // Load data when date range changes
  useEffect(() => {
    console.log('📅 [CalendarView] Navigation effect triggered:', {
      displayDateRange: navigation.displayDateRange,
      view: navigation.view,
      currentDate: navigation.currentDate
    });
    
    if (navigation.displayDateRange) {
      console.log('🔄 [CalendarView] Loading data for date range:', navigation.displayDateRange);
      calendarData.loadDataForDateRange(
        navigation.displayDateRange.start,
        navigation.displayDateRange.end,
        navigation.view
      );
    }
  }, [navigation.displayDateRange, navigation.view, calendarData.loadDataForDateRange]);

  // Filter events based on active filters
  const filteredEvents = useMemo(() => {
    let events = calendarData.events;

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      events = events.filter(event =>
        event.title.toLowerCase().includes(searchLower) ||
        event.customerName?.toLowerCase().includes(searchLower) ||
        event.assignee?.toLowerCase().includes(searchLower) ||
        event.description?.toLowerCase().includes(searchLower)
      );
    }

    if (filters.status) {
      events = events.filter(event => event.status === filters.status);
    }

    if (filters.type) {
      events = events.filter(event => event.type === filters.type);
    }

    if (filters.assignee) {
      if (filters.assignee === 'unassigned') {
        events = events.filter(event => event.type === 'request' && !event.assignee);
      } else {
        events = events.filter(event => event.assignee === filters.assignee);
      }
    }

    return events;
  }, [calendarData.events, filters]);

  // Handle event clicks
  const handleEventClick = useCallback(async (event: CalendarEventType) => {
    setSelectedEvent(event);
    
    if (event.type === 'request' && event.requestId) {
      try {
        // Here you would fetch the full request details
        // For now, we'll create a mock request object
        const mockRequest: TechRequest = {
          id: event.requestId,
          full_name: event.customerName || 'לא צוין',
          phone: event.customerPhone || '',
          email: '',
          address: event.address || '',
          problem_description: event.description || '',
          urgency_level: (event.urgencyLevel as TechRequest['urgency_level']) || 'medium',
          status: (event.status as TechRequest['status']) || 'pending',
          notes: event.notes || undefined,
          assigned_admin_id: undefined,
          assigned_admin: event.assignee ? { 
            id: 1, 
            username: event.assignee, 
            role: event.assigneeRole as 'SYSTEM_ADMIN' | 'VOLUNTEER',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          } : undefined,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          scheduled_date: new Date(event.start).toISOString().split('T')[0],
          scheduled_time: new Date(event.start).toTimeString().split(' ')[0].substring(0, 5),
          booked_slot_id: event.slotId
        };
        
        setSelectedRequest(mockRequest);
        setShowEventDetails(true);
      } catch (err) {
        console.error('Error loading request details:', err);
      }
    }
  }, []);

  // Handle time slot clicks (for creating new events)
  const handleTimeSlotClick = useCallback((date: Date, time: string) => {
    if (calendarData.userRole === 'SYSTEM_ADMIN') {
      // Here you could open a dialog to create new slots or requests
      console.log('Create new event at:', date, time);
    }
  }, [calendarData.userRole]);

  // Navigation handlers
  const handlePrevious = useCallback(() => {
    if (navigation.view === 'week') {
      navigation.goToPreviousWeek();
    } else {
      navigation.goToPreviousMonth();
    }
  }, [navigation]);

  const handleNext = useCallback(() => {
    if (navigation.view === 'week') {
      navigation.goToNextWeek();
    } else {
      navigation.goToNextMonth();
    }
  }, [navigation]);

  // Handle data refresh
  const handleRefresh = useCallback(() => {
    calendarData.refreshData();
  }, [calendarData]);

  // Handle request modal updates
  const handleRequestUpdate = useCallback(() => {
    calendarData.refreshData();
    setShowEventDetails(false);
    setSelectedRequest(null);
  }, [calendarData]);

  // Handle export (placeholder)
  const handleExport = useCallback(() => {
    // Implement export functionality
    console.log('Export calendar data');
  }, []);

  // Loading state
  if (calendarData.loading && !calendarData.data) {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-gray-600">טוען נתוני לוח שנה...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (calendarData.error) {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-reverse space-x-2 text-red-700">
          <AlertCircle className="w-5 h-5" />
          <span>{calendarData.error}</span>
        </div>
        <Button onClick={handleRefresh}>נסה שוב</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Calendar Header */}
      <CalendarHeader
        currentDate={navigation.currentDate}
        view={navigation.view}
        displayDate={navigation.formatDisplayDate()}
        onPrevious={handlePrevious}
        onNext={handleNext}
        onToday={navigation.goToToday}
        onViewChange={navigation.setView}
        onDateSelect={navigation.goToDate}
        loading={calendarData.loading}
      />

      {/* Calendar Controls */}
      <CalendarControls
        userRole={calendarData.userRole}
        events={filteredEvents}
        onRefresh={handleRefresh}
        onExport={handleExport}
        onFilterChange={setFilters}
        loading={calendarData.loading}
      />

      {/* Main Calendar Content */}
      <div className="max-w-7xl mx-auto py-6 px-4">
        {navigation.view === 'week' ? (
          <WeeklyView
            events={filteredEvents}
            weekDays={navigation.getWeekDays()}
            onEventClick={handleEventClick}
            onTimeSlotClick={handleTimeSlotClick}
            loading={calendarData.loading}
          />
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">תצוגת חודש</h3>
            <p className="text-gray-600">תצוגת חודש תתווסף בעדכון עתידי</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => navigation.setView('week')}
            >
              חזור לתצוגת שבוע
            </Button>
          </div>
        )}
      </div>

      {/* Request Details Modal */}
      {showEventDetails && selectedRequest && (
        <RequestDetailsModal
          request={selectedRequest}
          onClose={() => {
            setShowEventDetails(false);
            setSelectedRequest(null);
            setSelectedEvent(null);
          }}
          onUpdate={handleRequestUpdate}
          showTakeRequestButton={calendarData.userRole === 'SYSTEM_ADMIN' && !selectedRequest.assigned_admin}
        />
      )}

      {/* Role-based info banner */}
      {calendarData.userRole && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:w-80">
          <div className={`
            p-3 rounded-lg shadow-lg text-sm
            ${calendarData.userRole === 'VOLUNTEER' 
              ? 'bg-blue-50 border border-blue-200 text-blue-700'
              : 'bg-green-50 border border-green-200 text-green-700'
            }
          `}>
            <div className="flex items-center justify-between">
              <span className="font-medium">
                {calendarData.userRole === 'VOLUNTEER' ? 'תצוגת מתנדב' : 'תצוגת מנהל מערכת'}
              </span>
              <span className="text-xs">
                {filteredEvents.length} אירועים
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarView;