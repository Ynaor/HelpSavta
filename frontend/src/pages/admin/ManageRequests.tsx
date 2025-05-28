import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Eye, Trash2, Phone, MapPin, Clock, AlertCircle, Filter, Edit2, Save, X, UserCheck, User } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Textarea } from '../../components/ui/textarea';
import { TechRequest, STATUS_LABELS, URGENCY_LABELS, AdminRequestUpdateForm } from '../../types';
import { adminAPI, requestsAPI } from '../../services/api';
import { formatDateTime, formatPhoneNumber, getErrorMessage } from '../../lib/utils';

const ManageRequests: React.FC = () => {
  const [requests, setRequests] = useState<TechRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<TechRequest | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editingRequestId, setEditingRequestId] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState<AdminRequestUpdateForm>({});
  const [takeRequestLoading, setTakeRequestLoading] = useState<number | null>(null);
  const [filters, setFilters] = useState({
    status: '',
    urgency_level: '',
    search: ''
  });
  const editingInputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const cursorPositionRef = useRef<number>(0);

  useEffect(() => {
    loadRequests();
  }, [filters]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      const params = {
        ...filters,
        page: 1,
        limit: 50
      };
      const result = await adminAPI.getRequests(params);
      
      // Ensure we always set an array
      let requestsData: TechRequest[] = [];
      if (Array.isArray(result)) {
        requestsData = result;
      } else if (result && Array.isArray((result as any).data)) {
        requestsData = (result as any).data;
      } else {
        console.warn('Unexpected result format:', result);
        requestsData = [];
      }
      
      
      setRequests(requestsData);
    } catch (err) {
      console.error('Error loading requests:', err);
      setError(getErrorMessage(err));
      setRequests([]); // Ensure requests is always an array
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (requestId: number, newStatus: TechRequest['status']) => {
    try {
      await requestsAPI.update(requestId, { status: newStatus });
      await loadRequests();
      setSelectedRequest(null);
      setShowDetails(false);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleDeleteRequest = async (requestId: number) => {
    if (!window.confirm('האם אתה בטוח שברצונך למחוק את הבקשה?')) {
      return;
    }

    try {
      await requestsAPI.delete(requestId);
      await loadRequests();
      setSelectedRequest(null);
      setShowDetails(false);
      setSuccess('בקשה נמחקה בהצלחה');
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleTakeRequest = async (requestId: number) => {
    if (!window.confirm('האם אתה בטוח שברצונך לקחת את הבקשה?')) {
      return;
    }

    try {
      setTakeRequestLoading(requestId);
      await adminAPI.takeRequest(requestId);
      await loadRequests();
      setSuccess('בקשה נלקחה בהצלחה');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setTakeRequestLoading(null);
    }
  };

  const handleStartEdit = useCallback((requestId: number, field: string, currentValue: any) => {
    setEditingRequestId(requestId);
    setEditingField(field);
    setEditFormData({ [field]: currentValue || '' });
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingRequestId(null);
    setEditingField(null);
    setEditFormData({});
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (!editingRequestId || !editingField) return;

    // Get the current value from editFormData state
    const currentValue = editFormData[editingField as keyof AdminRequestUpdateForm] || '';
    const dataToSave = { [editingField]: currentValue };

    try {
      const updatedRequest = await adminAPI.updateRequestAsAdmin(editingRequestId, dataToSave);
      
      // Update local state with the response data instead of reloading all requests
      setRequests(prevRequests =>
        prevRequests.map(req =>
          req.id === editingRequestId ? { ...req, ...updatedRequest } : req
        )
      );
      
      // Update selectedRequest if it's the one being edited
      if (selectedRequest && selectedRequest.id === editingRequestId) {
        setSelectedRequest({ ...selectedRequest, ...updatedRequest });
      }
      
      handleCancelEdit();
      setSuccess('שדה עודכן בהצלחה');
    } catch (err) {
      console.error('❌ SAVE ERROR:', err);
      setError(getErrorMessage(err));
    }
  }, [editingRequestId, editingField, editFormData, handleCancelEdit, selectedRequest]);

  const handleFieldChange = useCallback((field: keyof AdminRequestUpdateForm, value: string, cursorPos?: number) => {
    // Store cursor position for restoration after render
    if (cursorPos !== undefined) {
      cursorPositionRef.current = cursorPos;
    }
    
    setEditFormData(prev => ({ ...prev, [field]: value }));
  }, [editFormData]);

  // Effect to restore cursor position after state updates
  useEffect(() => {
    if (editingInputRef.current && cursorPositionRef.current !== undefined) {
      const element = editingInputRef.current;
      const position = cursorPositionRef.current;
      
      // Use setTimeout to ensure DOM has updated
      setTimeout(() => {
        element.setSelectionRange(position, position);
      }, 0);
    }
  }, [editFormData]);

  // Helper function to detect Hebrew text
  const containsHebrew = (text: string): boolean => {
    const hebrewRegex = /[\u0590-\u05FF]/;
    return hebrewRegex.test(text);
  };

  // Helper function to get text direction based on content
  const getTextDirection = (text: string): string => {
    if (!text) return 'auto';
    return containsHebrew(text) ? 'rtl' : 'ltr';
  };

  const renderEditableField = (request: TechRequest, field: keyof AdminRequestUpdateForm, label: string, type: 'text' | 'textarea' | 'select' = 'text') => {
    const isEditing = editingRequestId === request.id && editingField === field;
    const value = request[field as keyof TechRequest] as string;

    if (isEditing) {
      // Use stable key that doesn't change during editing
      const inputKey = `edit-${field}`;
      const currentValue = editFormData[field] as string || '';
      const currentDirection = getTextDirection(currentValue);
      
      
      if (type === 'textarea') {
        return (
          <div className="flex items-start space-x-reverse space-x-2">
            <Textarea
              key={inputKey}
              value={currentValue}
              ref={editingInputRef as React.RefObject<HTMLTextAreaElement>}
              onChange={(e) => {
                const newValue = e.target.value;
                const cursorPos = e.target.selectionStart;
                handleFieldChange(field, newValue, cursorPos || 0);
              }}
              className="flex-1"
              rows={3}
              autoFocus
              dir={currentDirection}
              style={{ textAlign: containsHebrew(currentValue) ? 'right' : 'left' }}
            />
            <div className="flex space-x-reverse space-x-1">
              <Button size="sm" onClick={handleSaveEdit}>
                <Save className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        );
      } else if (type === 'select' && field === 'urgency_level') {
        return (
          <div className="flex items-center space-x-reverse space-x-2">
            <Select
              key={inputKey}
              value={(editFormData[field] as string) || ''}
              onChange={(e) => handleFieldChange(field, e.target.value)}
              className="flex-1"
            >
              <option value="low">{URGENCY_LABELS.low}</option>
              <option value="medium">{URGENCY_LABELS.medium}</option>
              <option value="high">{URGENCY_LABELS.high}</option>
              <option value="urgent">{URGENCY_LABELS.urgent}</option>
            </Select>
            <div className="flex space-x-reverse space-x-1">
              <Button size="sm" onClick={handleSaveEdit}>
                <Save className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        );
      } else {
        return (
          <div className="flex items-center space-x-reverse space-x-2">
            <Input
              key={inputKey}
              type="text"
              value={currentValue}
              ref={editingInputRef as React.RefObject<HTMLInputElement>}
              onChange={(e) => {
                const newValue = e.target.value;
                const cursorPos = e.target.selectionStart;
                handleFieldChange(field, newValue, cursorPos || 0);
              }}
              className="flex-1"
              autoFocus
              dir={currentDirection}
              style={{ textAlign: containsHebrew(currentValue) ? 'right' : 'left' }}
            />
            <div className="flex space-x-reverse space-x-1">
              <Button size="sm" onClick={handleSaveEdit}>
                <Save className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        );
      }
    }

    return (
      <div className="flex items-start justify-between group">
        <div className="flex-1">
          <span className="font-medium">{label}:</span>{' '}
          {field === 'urgency_level' ? (
            <span className={getUrgencyBadgeClass(value as TechRequest['urgency_level'])}>
              {URGENCY_LABELS[value as TechRequest['urgency_level']]}
            </span>
          ) : (
            <span>{value || 'לא צוין'}</span>
          )}
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => handleStartEdit(request.id, field, value)}
        >
          <Edit2 className="w-4 h-4" />
        </Button>
      </div>
    );
  };

  const getStatusBadgeClass = (status: TechRequest['status']) => {
    const baseClass = "px-2 py-1 rounded-full text-xs font-medium border";
    switch (status) {
      case 'pending': return `${baseClass} status-pending`;
      case 'in_progress': return `${baseClass} status-in_progress`;
      case 'completed': return `${baseClass} status-completed`;
      case 'cancelled': return `${baseClass} status-cancelled`;
      default: return baseClass;
    }
  };

  const getUrgencyBadgeClass = (urgency: TechRequest['urgency_level']) => {
    const baseClass = "px-2 py-1 rounded-full text-xs font-medium border";
    switch (urgency) {
      case 'low': return `${baseClass} urgency-low`;
      case 'medium': return `${baseClass} urgency-medium`;
      case 'high': return `${baseClass} urgency-high`;
      case 'urgent': return `${baseClass} urgency-urgent`;
      default: return baseClass;
    }
  };

  const RequestDetailsModal = ({ request }: { request: TechRequest }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>פרטי בקשה #{request.id}</span>
            <Button variant="ghost" size="sm" onClick={() => setShowDetails(false)}>
              ×
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Assignment Info */}
          <div className="space-y-3">
            <h3 className="font-medium">הקצאה</h3>
            <div className="flex items-center space-x-reverse space-x-2">
              {request.assigned_admin ? (
                <div className="flex items-center space-x-reverse space-x-2 text-green-700 bg-green-50 px-3 py-2 rounded">
                  <UserCheck className="w-4 h-4" />
                  <span>מוקצה למנהל: {request.assigned_admin.username}</span>
                </div>
              ) : (
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center space-x-reverse space-x-2 text-orange-700 bg-orange-50 px-3 py-2 rounded">
                    <User className="w-4 h-4" />
                    <span>לא מוקצה</span>
                  </div>
                  <Button
                    onClick={() => handleTakeRequest(request.id)}
                    disabled={takeRequestLoading === request.id}
                    size="sm"
                  >
                    {takeRequestLoading === request.id ? (
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    ) : (
                      <UserCheck className="w-4 h-4 ml-1" />
                    )}
                    {takeRequestLoading === request.id ? 'לוקח...' : 'קח בקשה'}
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Personal Info */}
          <div className="space-y-3">
            <h3 className="font-medium">פרטים אישיים</h3>
            <div className="space-y-3">
              {renderEditableField(request, 'full_name', 'שם')}
              <div className="flex items-center space-x-reverse space-x-2">
                <Phone className="w-4 h-4" />
                {renderEditableField(request, 'phone', 'טלפון')}
              </div>
              {renderEditableField(request, 'email', 'כתובת דוא"ל')}
              <div className="flex items-start space-x-reverse space-x-2">
                <MapPin className="w-4 h-4 mt-1" />
                {renderEditableField(request, 'address', 'כתובת')}
              </div>
            </div>
          </div>

          {/* Status and Priority */}
          <div className="space-y-3">
            <h3 className="font-medium">סטטוס ודחיפות</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-reverse space-x-2">
                <span className="font-medium">סטטוס:</span>
                <span className={getStatusBadgeClass(request.status)}>
                  {STATUS_LABELS[request.status]}
                </span>
              </div>
              {renderEditableField(request, 'urgency_level', 'דחיפות', 'select')}
            </div>
          </div>

          {/* Problem Description */}
          <div className="space-y-3">
            <h3 className="font-medium">תיאור הבעיה</h3>
            {renderEditableField(request, 'problem_description', 'תיאור הבעיה', 'textarea')}
          </div>

          {/* Schedule Info */}
          {request.scheduled_date && request.scheduled_time && (
            <div className="space-y-3">
              <h3 className="font-medium">זמן מתוכנן</h3>
              <div className="flex items-center space-x-reverse space-x-2 text-sm">
                <Clock className="w-4 h-4" />
                <span>{request.scheduled_date} בשעה {request.scheduled_time}</span>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-3">
            <h3 className="font-medium">הערות</h3>
            {renderEditableField(request, 'notes', 'הערות', 'textarea')}
          </div>

          {/* Timestamps */}
          <div className="space-y-3 text-sm text-gray-600">
            <div>נוצר: {formatDateTime(request.created_at)}</div>
            <div>עודכן: {formatDateTime(request.updated_at)}</div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-4 border-t">
            <Select
              value={request.status}
              onChange={(e) => handleStatusUpdate(request.id, e.target.value as TechRequest['status'])}
              className="flex-1 min-w-[150px]"
            >
              <option value="pending">{STATUS_LABELS.pending}</option>
              <option value="in_progress">{STATUS_LABELS.in_progress}</option>
              <option value="completed">{STATUS_LABELS.completed}</option>
              <option value="cancelled">{STATUS_LABELS.cancelled}</option>
            </Select>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleDeleteRequest(request.id)}
            >
              <Trash2 className="w-4 h-4 ml-1" />
              מחק
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">ניהול בקשות עזרה</h1>
        <p className="text-gray-600">
          כאן תוכל לנהל את כל בקשות העזרה הטכנית שהתקבלו
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center space-x-reverse space-x-2">
            <Filter className="w-5 h-5" />
            <span>סינון וחיפוש</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">סטטוס</label>
              <Select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <option value="">כל הסטטוסים</option>
                <option value="pending">{STATUS_LABELS.pending}</option>
                <option value="in_progress">{STATUS_LABELS.in_progress}</option>
                <option value="completed">{STATUS_LABELS.completed}</option>
                <option value="cancelled">{STATUS_LABELS.cancelled}</option>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">דחיפות</label>
              <Select
                value={filters.urgency_level}
                onChange={(e) => setFilters({ ...filters, urgency_level: e.target.value })}
              >
                <option value="">כל הרמות</option>
                <option value="low">{URGENCY_LABELS.low}</option>
                <option value="medium">{URGENCY_LABELS.medium}</option>
                <option value="high">{URGENCY_LABELS.high}</option>
                <option value="urgent">{URGENCY_LABELS.urgent}</option>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">חיפוש</label>
              <Input
                type="text"
                placeholder="חפש לפי שם, טלפון, דוא&quot;ל או תיאור..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                dir={getTextDirection(filters.search)}
                style={{ textAlign: containsHebrew(filters.search) ? 'right' : 'left' }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-reverse space-x-2 text-red-700">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Success Display */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-reverse space-x-2 text-green-700">
          <UserCheck className="w-5 h-5" />
          <span>{success}</span>
        </div>
      )}

      {/* Requests List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-gray-600">טוען בקשות...</p>
        </div>
      ) : requests.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-600">לא נמצאו בקשות המתאימות לקריטריונים</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <Card key={request.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center space-x-reverse space-x-4">
                      <h3 className="font-medium text-lg">
                        בקשה #{request.id} - {request.full_name}
                      </h3>
                      <div className="flex space-x-reverse space-x-2">
                        <span className={getStatusBadgeClass(request.status)}>
                          {STATUS_LABELS[request.status]}
                        </span>
                        <span className={getUrgencyBadgeClass(request.urgency_level)}>
                          {URGENCY_LABELS[request.urgency_level]}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-reverse space-x-2">
                        <Phone className="w-4 h-4" />
                        <a href={`tel:${request.phone}`} className="hover:text-blue-600">
                          {formatPhoneNumber(request.phone)}
                        </a>
                      </div>
                      <div className="flex items-center space-x-reverse space-x-2">
                        <span>📧</span>
                        <a href={`mailto:${request.email}`} className="hover:text-blue-600 truncate">
                          {request.email}
                        </a>
                      </div>
                      <div className="flex items-center space-x-reverse space-x-2">
                        <Clock className="w-4 h-4" />
                        <span>{formatDateTime(request.created_at)}</span>
                      </div>
                      <div className="flex items-center space-x-reverse space-x-2">
                        {request.assigned_admin ? (
                          <div className="flex items-center space-x-reverse space-x-1 text-green-600">
                            <UserCheck className="w-4 h-4" />
                            <span>מוקצה ל: {request.assigned_admin.username}</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-reverse space-x-1 text-orange-600">
                            <User className="w-4 h-4" />
                            <span>לא מוקצה</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <p className="text-sm text-gray-700 line-clamp-2">
                      {request.problem_description}
                    </p>
                  </div>

                  <div className="flex flex-col space-y-2 mr-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedRequest(request);
                        setShowDetails(true);
                      }}
                    >
                      <Eye className="w-4 h-4 ml-1" />
                      צפה
                    </Button>
                    {!request.assigned_admin && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleTakeRequest(request.id)}
                        disabled={takeRequestLoading === request.id}
                      >
                        {takeRequestLoading === request.id ? (
                          <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full ml-1" />
                        ) : (
                          <UserCheck className="w-4 h-4 ml-1" />
                        )}
                        {takeRequestLoading === request.id ? 'לוקח...' : 'קח בקשה'}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Request Details Modal */}
      {showDetails && selectedRequest && (
        <RequestDetailsModal request={selectedRequest} />
      )}
    </div>
  );
};

export default ManageRequests;