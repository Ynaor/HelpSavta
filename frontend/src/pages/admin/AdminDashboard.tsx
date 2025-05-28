import React, { useState, useEffect } from 'react';
import {
  FileText,
  Calendar,
  Clock,
  AlertCircle,
  Users,
  TrendingUp,
  Eye
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { DashboardStats, STATUS_LABELS, URGENCY_LABELS, TechRequest } from '../../types';
import { adminAPI } from '../../services/api';
import { formatDateTime, getErrorMessage } from '../../lib/utils';
import RequestDetailsModal from '../../components/requests/RequestDetailsModal';

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
                        {formatDateTime(request.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center space-x-reverse space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
                        request.status === 'in_progress' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                        request.status === 'completed' ? 'bg-green-100 text-green-700 border-green-200' :
                        'bg-gray-100 text-gray-700 border-gray-200'
                      }`}>
                        {STATUS_LABELS[request.status]}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedRequest(request);
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
                        {formatDateTime(request.created_at)}
                      </p>
                      <span className={`inline-block mt-1 px-2 py-1 rounded-full text-xs font-medium border ${getUrgencyColor(request.urgency_level)}`}>
                        {URGENCY_LABELS[request.urgency_level]}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedRequest(request);
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
