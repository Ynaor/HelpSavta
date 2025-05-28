import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  FileText,
  Calendar,
  Clock,
  AlertCircle,
  Users,
  TrendingUp,
  Eye,
  Phone,
  MapPin,
  UserCheck,
  User,
  Trash2,
  Edit2,
  Save,
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import { Textarea } from '../../components/ui/textarea';
import { DashboardStats, STATUS_LABELS, URGENCY_LABELS, TechRequest, AdminRequestUpdateForm } from '../../types';
import { adminAPI, requestsAPI } from '../../services/api';
import { formatDateTime, getErrorMessage, formatPhoneNumber } from '../../lib/utils';

// Request Details Modal Component
const RequestDetailsModal = ({ request, onClose, onUpdate }: {
  request: TechRequest;
  onClose: () => void;
  onUpdate: () => void;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editingRequestId, setEditingRequestId] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState<AdminRequestUpdateForm>({});
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const editingInputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const cursorPositionRef = useRef<number>(0);
  const handleStatusUpdate = async (requestId: number, newStatus: TechRequest['status']) => {
    try {
      await requestsAPI.update(requestId, { status: newStatus });
      onUpdate(); // Refresh dashboard data
      onClose();
    } catch (err) {
      console.error('Error updating status:', err);
      setError('שגיאה בעדכון הסטטוס');
    }
  };

  const handleStartEdit = useCallback((field: string, currentValue: any) => {
    setEditingRequestId(request.id);
    setEditingField(field);
    setEditFormData({ [field]: currentValue || '' });
    setError('');
    setSuccess('');
  }, [request.id]);

  const handleCancelEdit = useCallback(() => {
    setEditingRequestId(null);
    setEditingField(null);
    setEditFormData({});
    setError('');
    setSuccess('');
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (!editingRequestId || !editingField) return;

    const currentValue = editFormData[editingField as keyof AdminRequestUpdateForm] || '';
    const dataToSave = { [editingField]: currentValue };

    try {
      const updatedRequest = await adminAPI.updateRequestAsAdmin(editingRequestId, dataToSave);
      
      // Update the request object locally to reflect changes immediately
      Object.assign(request, updatedRequest);
      
      onUpdate(); // Refresh dashboard data
      handleCancelEdit();
      setSuccess('שדה עודכן בהצלחה');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error saving edit:', err);
      setError('שגיאה בשמירת השינויים');
    }
  }, [editingRequestId, editingField, editFormData, request, onUpdate, handleCancelEdit]);

  const handleFieldChange = useCallback((field: keyof AdminRequestUpdateForm, value: string, cursorPos?: number) => {
    if (cursorPos !== undefined) {
      cursorPositionRef.current = cursorPos;
    }
    
    setEditFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  // Effect to restore cursor position after state updates
  useEffect(() => {
    if (editingInputRef.current && cursorPositionRef.current !== undefined) {
      const element = editingInputRef.current;
      const position = cursorPositionRef.current;
      
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

  const renderEditableField = (field: keyof AdminRequestUpdateForm, label: string, type: 'text' | 'textarea' | 'select' = 'text') => {
    const isEditingThisField = editingField === field;
    const value = request[field as keyof TechRequest] as string;

    if (isEditingThisField) {
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
          onClick={() => handleStartEdit(field, value)}
        >
          <Edit2 className="w-4 h-4" />
        </Button>
      </div>
    );
  };

  const handleDeleteRequest = async (requestId: number) => {
    if (!window.confirm('האם אתה בטוח שברצונך למחוק את הבקשה?')) {
      return;
    }

    try {
      await requestsAPI.delete(requestId);
      onUpdate(); // Refresh dashboard data
      onClose();
    } catch (err) {
      console.error('Error deleting request:', err);
    }
  };

  const getStatusBadgeClass = (status: TechRequest['status']) => {
    const baseClass = "px-2 py-1 rounded-full text-xs font-medium border";
    switch (status) {
      case 'pending': return `${baseClass} bg-yellow-100 text-yellow-700 border-yellow-200`;
      case 'in_progress': return `${baseClass} bg-blue-100 text-blue-700 border-blue-200`;
      case 'completed': return `${baseClass} bg-green-100 text-green-700 border-green-200`;
      case 'cancelled': return `${baseClass} bg-gray-100 text-gray-700 border-gray-200`;
      default: return baseClass;
    }
  };

  const getUrgencyBadgeClass = (urgency: TechRequest['urgency_level']) => {
    const baseClass = "px-2 py-1 rounded-full text-xs font-medium border";
    switch (urgency) {
      case 'low': return `${baseClass} bg-green-100 text-green-700 border-green-200`;
      case 'medium': return `${baseClass} bg-yellow-100 text-yellow-700 border-yellow-200`;
      case 'high': return `${baseClass} bg-orange-100 text-orange-700 border-orange-200`;
      case 'urgent': return `${baseClass} bg-red-100 text-red-700 border-red-200`;
      default: return baseClass;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>פרטי בקשה #{request.id}</span>
            <div className="flex items-center space-x-reverse space-x-2">
              {!editingField && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  <Edit2 className="w-4 h-4 ml-1" />
                  עריכה
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={onClose}>
                ×
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Success/Error Messages */}
          {success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
              {success}
            </div>
          )}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}
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
                <div className="flex items-center space-x-reverse space-x-2 text-orange-700 bg-orange-50 px-3 py-2 rounded">
                  <User className="w-4 h-4" />
                  <span>לא מוקצה</span>
                </div>
              )}
            </div>
          </div>

          {/* Personal Info */}
          <div className="space-y-3">
            <h3 className="font-medium">פרטים אישיים</h3>
            <div className="space-y-3">
              {renderEditableField('full_name', 'שם')}
              <div className="flex items-center space-x-reverse space-x-2">
                <Phone className="w-4 h-4" />
                {renderEditableField('phone', 'טלפון')}
              </div>
              <div className="flex items-start space-x-reverse space-x-2">
                <MapPin className="w-4 h-4 mt-1" />
                {renderEditableField('address', 'כתובת')}
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
              {renderEditableField('urgency_level', 'דחיפות', 'select')}
            </div>
          </div>

          {/* Problem Description */}
          <div className="space-y-3">
            <h3 className="font-medium">תיאור הבעיה</h3>
            {renderEditableField('problem_description', 'תיאור הבעיה', 'textarea')}
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
            {renderEditableField('notes', 'הערות', 'textarea')}
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
};

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<TechRequest | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await adminAPI.getDashboard();
      setStats(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'urgent': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-gray-600">טוען נתוני לוח הבקרה...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-reverse space-x-2 text-red-700">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
        <Button onClick={loadDashboardData}>נסה שוב</Button>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4">
        <p className="text-center text-gray-600">אין נתונים להצגה</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">לוח בקרה</h1>
        <p className="text-gray-600">
          סקירה כללית של מערכת ניהול העזרה הטכנית
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Requests */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">סה"כ בקשות</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.statistics.requests.total}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pending Requests */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">בקשות ממתינות</p>
                <p className="text-2xl font-bold text-orange-600">
                  {stats.statistics.requests.pending}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Available Slots */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">זמנים פנויים</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.statistics.slots.available}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Completed Requests */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">בקשות שהושלמו</p>
                <p className="text-2xl font-bold text-purple-600">
                  {stats.statistics.requests.completed}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Requests */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>בקשות אחרונות</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/admin/requests')}
              >
                צפה בהכל
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentRequests && stats.recentRequests.length > 0 ? (
              <div className="space-y-4">
                {stats.recentRequests.slice(0, 5).map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm">
                        {request.full_name} - בקשה #{request.id}
                      </p>
                      <p className="text-xs text-gray-600">
                        {request.created_at && formatDateTime(request.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center space-x-reverse space-x-2">
                      {request.status && (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
                          request.status === 'in_progress' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                          request.status === 'completed' ? 'bg-green-100 text-green-700 border-green-200' :
                          'bg-gray-100 text-gray-700 border-gray-200'
                        }`}>
                          {STATUS_LABELS[request.status as keyof typeof STATUS_LABELS]}
                        </span>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          // Create a complete TechRequest object from the partial request
                          const fullRequest: TechRequest = {
                            id: request.id!,
                            full_name: request.full_name || '',
                            phone: request.phone || '',
                            address: request.address || '',
                            problem_description: request.problem_description || '',
                            urgency_level: request.urgency_level || 'medium',
                            status: request.status || 'pending',
                            notes: request.notes || '',
                            scheduled_date: request.scheduled_date || '',
                            scheduled_time: request.scheduled_time || '',
                            created_at: request.created_at || '',
                            updated_at: request.updated_at || '',
                            assigned_admin: request.assigned_admin || undefined
                          };
                          setSelectedRequest(fullRequest);
                          setShowDetails(true);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 text-center py-8">אין בקשות אחרונות</p>
            )}
          </CardContent>
        </Card>

        {/* Urgent Requests */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-reverse space-x-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <span>בקשות דחופות</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/admin/requests?urgency=urgent')}
              >
                צפה בהכל
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.urgentRequests && stats.urgentRequests.length > 0 ? (
              <div className="space-y-4">
                {stats.urgentRequests.slice(0, 5).map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm text-red-800">
                        {request.full_name} - בקשה #{request.id}
                      </p>
                      <p className="text-xs text-red-600">
                        {request.created_at && formatDateTime(request.created_at)}
                      </p>
                      {request.urgency_level && (
                        <span className={`inline-block mt-1 px-2 py-1 rounded-full text-xs font-medium border ${getUrgencyColor(request.urgency_level)}`}>
                          {URGENCY_LABELS[request.urgency_level as keyof typeof URGENCY_LABELS]}
                        </span>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        // Create a complete TechRequest object from the partial request
                        const fullRequest: TechRequest = {
                          id: request.id!,
                          full_name: request.full_name || '',
                          phone: request.phone || '',
                          address: request.address || '',
                          problem_description: request.problem_description || '',
                          urgency_level: request.urgency_level || 'medium',
                          status: request.status || 'pending',
                          notes: request.notes || '',
                          scheduled_date: request.scheduled_date || '',
                          scheduled_time: request.scheduled_time || '',
                          created_at: request.created_at || '',
                          updated_at: request.updated_at || '',
                          assigned_admin: request.assigned_admin || undefined
                        };
                        setSelectedRequest(fullRequest);
                        setShowDetails(true);
                      }}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 text-center py-8">אין בקשות דחופות</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>פעולות מהירות</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button
              variant="outline"
              className="justify-start h-auto p-4"
              onClick={() => navigate('/admin/requests')}
            >
              <div className="flex items-center space-x-reverse space-x-3">
                <FileText className="w-5 h-5 text-blue-600" />
                <div className="text-right">
                  <p className="font-medium">ניהול בקשות</p>
                  <p className="text-sm text-gray-600">צפה ועדכן בקשות</p>
                </div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="justify-start h-auto p-4"
              onClick={() => navigate('/admin/slots')}
            >
              <div className="flex items-center space-x-reverse space-x-3">
                <Calendar className="w-5 h-5 text-green-600" />
                <div className="text-right">
                  <p className="font-medium">ניהול זמנים</p>
                  <p className="text-sm text-gray-600">הוסף זמנים פנויים</p>
                </div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="justify-start h-auto p-4"
              onClick={() => navigate('/admin/notifications')}
            >
              <div className="flex items-center space-x-reverse space-x-3">
                <AlertCircle className="w-5 h-5 text-orange-600" />
                <div className="text-right">
                  <p className="font-medium">יומן הודעות</p>
                  <p className="text-sm text-gray-600">מעקב הודעות</p>
                </div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="justify-start h-auto p-4"
              onClick={() => navigate('/admin/admins')}
            >
              <div className="flex items-center space-x-reverse space-x-3">
                <Users className="w-5 h-5 text-purple-600" />
                <div className="text-right">
                  <p className="font-medium">ניהול מנהלים</p>
                  <p className="text-sm text-gray-600">הוסף מנהלים חדשים</p>
                </div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Request Details Modal */}
      {showDetails && selectedRequest && (
        <RequestDetailsModal
          request={selectedRequest}
          onClose={() => setShowDetails(false)}
          onUpdate={loadDashboardData}
        />
      )}
    </div>
  );
};

export default AdminDashboard;
