import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Trash2, Phone, MapPin, Clock, Edit2, Save, X, UserCheck, User } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select } from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Textarea } from '../ui/textarea';
import { TechRequest, STATUS_LABELS, URGENCY_LABELS, AdminRequestUpdateForm } from '../../types';
import { adminAPI, requestsAPI } from '../../services/api';
import { formatDateTime, getErrorMessage } from '../../lib/utils';
import SlotStatusNotification from '../admin/SlotStatusNotification';

interface RequestDetailsModalProps {
  request: TechRequest;
  onClose: () => void;
  onUpdate: () => void;
  onSlotUpdate?: () => void; // New prop for slot data refresh
  showTakeRequestButton?: boolean;
}

const RequestDetailsModal: React.FC<RequestDetailsModalProps> = ({
  request,
  onClose,
  onUpdate,
  onSlotUpdate,
  showTakeRequestButton = false
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editingRequestId, setEditingRequestId] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState<AdminRequestUpdateForm>({});
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [takeRequestLoading, setTakeRequestLoading] = useState<number | null>(null);
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [slotNotification, setSlotNotification] = useState<{
    type: 'slot_released' | 'slot_deleted' | 'success' | 'error';
    message: string;
  } | null>(null);
  const editingInputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const cursorPositionRef = useRef<number>(0);


  const handleStatusUpdate = async (requestId: number, newStatus: TechRequest['status']) => {
    try {
      setStatusUpdateLoading(true);
      setError('');
      await requestsAPI.update(requestId, { status: newStatus });
      
      // Show specialized notifications for status changes that affect slots
      if (newStatus === 'completed') {
        setSlotNotification({
          type: 'slot_deleted',
          message: 'הבקשה הושלמה והזמן הזמין נמחק מהמערכת'
        });
      } else if (newStatus === 'cancelled') {
        setSlotNotification({
          type: 'slot_released',
          message: 'הבקשה בוטלה והזמן הזמין שוחרר'
        });
      } else {
        setSuccess('סטטוס הבקשה עודכן בהצלחה');
      }
      
      onUpdate(); // Refresh request data
      if (onSlotUpdate) {
        onSlotUpdate(); // Refresh slot data
      }
      
      // Close modal after a short delay to show success message
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Error updating status:', err);
      setError(getErrorMessage(err));
    } finally {
      setStatusUpdateLoading(false);
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

  // ESC key handler to close modal
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        // If currently editing a field, cancel edit instead of closing modal
        if (editingField) {
          handleCancelEdit();
        } else {
          onClose();
        }
      }
    };

    // Add event listener when modal opens
    document.addEventListener('keydown', handleEscapeKey);

    // Cleanup event listener when modal closes
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [editingField, handleCancelEdit, onClose]);

  const handleSaveEdit = useCallback(async () => {
    if (!editingRequestId || !editingField) return;

    const currentValue = editFormData[editingField as keyof AdminRequestUpdateForm] || '';
    const dataToSave = { [editingField]: currentValue };

    try {
      const updatedRequest = await adminAPI.updateRequestAsAdmin(editingRequestId, dataToSave);
      
      // Update the request object locally to reflect changes immediately
      Object.assign(request, updatedRequest);
      
      onUpdate(); // Refresh data
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

  const handleTakeRequest = async (requestId: number) => {
    if (!window.confirm('האם אתה בטוח שברצונך לקחת את הבקשה?')) {
      return;
    }

    try {
      setTakeRequestLoading(requestId);
      await adminAPI.takeRequest(requestId);
      onUpdate();
      setSuccess('בקשה נלקחה בהצלחה');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setTakeRequestLoading(null);
    }
  };

  const handleDeleteRequest = async (requestId: number) => {
    if (!window.confirm('האם אתה בטוח שברצונך למחוק את הבקשה? אם הבקשה קשורה לזמן זמין, הזמן ישוחרר.')) {
      return;
    }

    try {
      setDeleteLoading(true);
      setError('');
      await requestsAPI.delete(requestId);
      setSlotNotification({
        type: 'slot_released',
        message: 'הבקשה נמחקה בהצלחה והזמן הזמין שוחרר'
      });
      onUpdate(); // Refresh request data
      if (onSlotUpdate) {
        onSlotUpdate(); // Refresh slot data
      }
      
      // Close modal after a short delay to show success message
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      console.error('Error deleting request:', err);
      setError(getErrorMessage(err));
    } finally {
      setDeleteLoading(false);
    }
  };

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
          {slotNotification && (
            <SlotStatusNotification
              type={slotNotification.type}
              message={slotNotification.message}
              onDismiss={() => setSlotNotification(null)}
              autoHide={false}
            />
          )}
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
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center space-x-reverse space-x-2 text-blue-700 bg-blue-50 px-3 py-2 rounded">
                    <User className="w-4 h-4" />
                    <span>לא מוקצה</span>
                  </div>
                  {showTakeRequestButton && (
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
                  )}
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
              {renderEditableField('email', 'כתובת דוא"ל')}
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
              disabled={statusUpdateLoading}
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
              disabled={deleteLoading || statusUpdateLoading}
            >
              {deleteLoading ? (
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <Trash2 className="w-4 h-4 ml-1" />
              )}
              {deleteLoading ? 'מוחק...' : 'מחק'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RequestDetailsModal;