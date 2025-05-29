import React, { useState } from 'react';
import { Filter, Download, Plus, Search, RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select } from '../ui/select';
import { CalendarEvent as CalendarEventType } from '../../types';

interface CalendarControlsProps {
  userRole: 'SYSTEM_ADMIN' | 'VOLUNTEER' | null;
  events: CalendarEventType[];
  onRefresh?: () => void;
  onCreateSlot?: () => void;
  onCreateRequest?: () => void;
  onExport?: () => void;
  onFilterChange?: (filters: CalendarFilters) => void;
  loading?: boolean;
}

export interface CalendarFilters {
  search?: string;
  status?: string;
  type?: string;
  assignee?: string;
}

const CalendarControls: React.FC<CalendarControlsProps> = ({
  userRole,
  events,
  onRefresh,
  onCreateSlot,
  onCreateRequest,
  onExport,
  onFilterChange,
  loading = false
}) => {
  const [filters, setFilters] = useState<CalendarFilters>({});
  const [showFilters, setShowFilters] = useState(false);

  const handleFilterChange = (key: keyof CalendarFilters, value: string) => {
    const newFilters = { ...filters, [key]: value || undefined };
    setFilters(newFilters);
    if (onFilterChange) {
      onFilterChange(newFilters);
    }
  };

  const clearFilters = () => {
    setFilters({});
    if (onFilterChange) {
      onFilterChange({});
    }
  };

  const getUniqueAssignees = (): string[] => {
    const assignees = events
      .filter(event => event.type === 'request' && event.assignee)
      .map(event => event.assignee!)
      .filter((assignee, index, self) => self.indexOf(assignee) === index);
    return assignees.sort();
  };

  const activeFiltersCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      {/* Main controls row */}
      <div className="flex items-center justify-between mb-4">
        {/* Left side - Search and filters */}
        <div className="flex items-center space-x-reverse space-x-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="חיפוש בקשות או זמנים..."
              value={filters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="pr-10 w-64"
            />
          </div>

          {/* Filter toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="relative"
          >
            <Filter className="w-4 h-4 ml-1" />
            מסננים
            {activeFiltersCount > 0 && (
              <span className="absolute -top-1 -left-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </Button>

          {/* Refresh */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center space-x-reverse space-x-1"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            רענן
          </Button>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center space-x-reverse space-x-2">
          {/* Export */}
          {onExport && (
            <Button
              variant="outline"
              size="sm"
              onClick={onExport}
              className="flex items-center space-x-reverse space-x-1"
            >
              <Download className="w-4 h-4" />
              ייצא
            </Button>
          )}

          {/* Create actions - visible to system admins */}
          {userRole === 'SYSTEM_ADMIN' && (
            <>
              {onCreateRequest && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onCreateRequest}
                  className="flex items-center space-x-reverse space-x-1"
                >
                  <Plus className="w-4 h-4" />
                  בקשה חדשה
                </Button>
              )}
              
              {onCreateSlot && (
                <Button
                  size="sm"
                  onClick={onCreateSlot}
                  className="flex items-center space-x-reverse space-x-1"
                >
                  <Plus className="w-4 h-4" />
                  זמן חדש
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Expandable filters */}
      {showFilters && (
        <div className="border-t border-gray-200 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Status filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                סטטוס
              </label>
              <Select
                value={filters.status || ''}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full"
              >
                <option value="">כל הסטטוסים</option>
                <option value="pending">ממתין</option>
                <option value="in_progress">בטיפול</option>
                <option value="completed">הושלם</option>
                <option value="cancelled">בוטל</option>
              </Select>
            </div>

            {/* Type filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                סוג
              </label>
              <Select
                value={filters.type || ''}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="w-full"
              >
                <option value="">הכל</option>
                <option value="request">בקשות</option>
                <option value="slot">זמנים פנויים</option>
              </Select>
            </div>

            {/* Assignee filter */}
            {userRole === 'SYSTEM_ADMIN' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  מטפל
                </label>
                <Select
                  value={filters.assignee || ''}
                  onChange={(e) => handleFilterChange('assignee', e.target.value)}
                  className="w-full"
                >
                  <option value="">כל המטפלים</option>
                  <option value="unassigned">לא מוקצה</option>
                  {getUniqueAssignees().map(assignee => (
                    <option key={assignee} value={assignee}>
                      {assignee}
                    </option>
                  ))}
                </Select>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-end space-x-reverse space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                disabled={activeFiltersCount === 0}
                className="flex-1"
              >
                נקה מסננים
              </Button>
            </div>
          </div>

          {/* Active filters summary */}
          {activeFiltersCount > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>מציג {events.length} תוצאות עם {activeFiltersCount} מסננים פעילים</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-blue-600 hover:text-blue-700"
                >
                  הסר כל המסננים
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stats row */}
      <div className="flex items-center justify-between text-sm text-gray-600 mt-4 pt-3 border-t border-gray-100">
        <div>
          סה"כ {events.length} אירועים
        </div>
        <div className="flex items-center space-x-reverse space-x-4">
          <span>{events.filter(e => e.type === 'request').length} בקשות</span>
          <span>{events.filter(e => e.type === 'slot').length} זמנים</span>
          {userRole === 'SYSTEM_ADMIN' && (
            <span>{events.filter(e => e.type === 'request' && !e.assignee).length} לא מוקצות</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalendarControls;