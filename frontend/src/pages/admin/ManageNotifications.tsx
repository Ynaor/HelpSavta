import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  RefreshCw, 
  Filter, 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  Clock,
  Send
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { NotificationLog } from '../../types';
import { adminAPI } from '../../services/api';
import { formatDateTime, getErrorMessage } from '../../lib/utils';

const ManageNotifications: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [resendingId, setResendingId] = useState<number | null>(null);
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    search: ''
  });

  useEffect(() => {
    loadNotifications();
  }, [filters]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError('');
      const params = {
        ...filters,
        page: 1,
        limit: 50
      };
      const result = await adminAPI.getNotifications(params);
      setNotifications(Array.isArray(result) ? result : []);
    } catch (err) {
      console.error('Error loading notifications:', err);
      setError(getErrorMessage(err));
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleResendNotification = async (id: number) => {
    try {
      setResendingId(id);
      setError('');
      await adminAPI.resendNotification(id);
      await loadNotifications(); // Reload to see updated status
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setResendingId(null);
    }
  };

  const getStatusIcon = (status: NotificationLog['status']) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      default:
        return <Bell className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusBadgeClass = (status: NotificationLog['status']) => {
    const baseClass = "px-2 py-1 rounded-full text-xs font-medium border";
    switch (status) {
      case 'sent':
        return `${baseClass} bg-green-50 text-green-700 border-green-200`;
      case 'failed':
        return `${baseClass} bg-red-50 text-red-700 border-red-200`;
      case 'pending':
        return `${baseClass} bg-yellow-50 text-yellow-700 border-yellow-200`;
      default:
        return `${baseClass} bg-gray-50 text-gray-700 border-gray-200`;
    }
  };

  const getStatusLabel = (status: NotificationLog['status']) => {
    switch (status) {
      case 'sent': return 'נשלח';
      case 'failed': return 'נכשל';
      case 'pending': return 'ממתין';
      default: return status;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'sms': return 'SMS';
      case 'email': return 'אימייל';
      case 'whatsapp': return 'WhatsApp';
      default: return type;
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">יומן הודעות</h1>
        <p className="text-gray-600">
          מעקב אחר כל ההודעות שנשלחו במערכת
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
              <label className="block text-sm font-medium mb-2">סוג הודעה</label>
              <Select
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              >
                <option value="">כל הסוגים</option>
                <option value="sms">SMS</option>
                <option value="email">אימייל</option>
                <option value="whatsapp">WhatsApp</option>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">סטטוס</label>
              <Select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <option value="">כל הסטטוסים</option>
                <option value="sent">נשלח</option>
                <option value="failed">נכשל</option>
                <option value="pending">ממתין</option>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">חיפוש</label>
              <Input
                placeholder="חפש לפי נמען או תוכן..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
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

      {/* Notifications List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-gray-600">טוען הודעות...</p>
        </div>
      ) : notifications.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">לא נמצאו הודעות המתאימות לקריטריונים</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <Card key={notification.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center space-x-reverse space-x-4">
                      <div className="flex items-center space-x-reverse space-x-2">
                        {getStatusIcon(notification.status)}
                        <h3 className="font-medium text-lg">
                          הודעה #{notification.id}
                        </h3>
                      </div>
                      <div className="flex space-x-reverse space-x-2">
                        <span className={getStatusBadgeClass(notification.status)}>
                          {getStatusLabel(notification.status)}
                        </span>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                          {getTypeLabel(notification.type)}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">נמען:</span> {notification.recipient}
                      </div>
                      <div>
                        <span className="font-medium">נשלח:</span> {formatDateTime(notification.sent_at)}
                      </div>
                    </div>

                    <div className="bg-gray-50 p-3 rounded border">
                      <p className="text-sm text-gray-700 font-medium mb-1">תוכן ההודעה:</p>
                      <p className="text-sm text-gray-800">{notification.message}</p>
                    </div>
                  </div>

                  <div className="flex space-x-reverse space-x-2 mr-4">
                    {notification.status === 'failed' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResendNotification(notification.id)}
                        disabled={resendingId === notification.id}
                      >
                        {resendingId === notification.id ? (
                          <div className="flex items-center space-x-reverse space-x-2">
                            <div className="animate-spin w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full"></div>
                            <span>שולח...</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-reverse space-x-2">
                            <Send className="w-4 h-4" />
                            <span>שלח מחדש</span>
                          </div>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Refresh Button */}
      <div className="mt-8 text-center">
        <Button
          variant="outline"
          onClick={loadNotifications}
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 ml-2 ${loading ? 'animate-spin' : ''}`} />
          רענן רשימה
        </Button>
      </div>
    </div>
  );
};

export default ManageNotifications;