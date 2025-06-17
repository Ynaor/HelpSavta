import React, { useState, useEffect } from 'react';
import { Eye, AlertCircle, Filter, Clock, Phone } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { TechRequest, STATUS_LABELS, URGENCY_LABELS } from '../../types';
import { adminAPI } from '../../services/api';
import { formatDateTime, formatPhoneNumber, getErrorMessage } from '../../lib/utils';
import RequestDetailsModal from '../../components/requests/RequestDetailsModal';

const ManageRequests: React.FC = () => {
  const [requests, setRequests] = useState<TechRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<TechRequest | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    urgency_level: '',
    search: ''
  });

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
                style={{ textAlign: filters.search.match(/[\u0590-\u05FF]/) ? 'right' : 'left' }}
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
          <span className="text-green-600">✓</span>
          <span>{success}</span>
        </div>
      )}

      {/* Requests List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
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
                            {/* <UserCheck className="w-4 h-4" /> */}
                            <span>מוקצה ל: {request.assigned_admin.username}</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-reverse space-x-1 text-blue-600">
                            {/* <User className="w-4 h-4" /> */}
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
                        onClick={() => {
                          setSelectedRequest(request);
                          setShowDetails(true);
                        }}
                      >
                        קח בקשה
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
        <RequestDetailsModal
          request={selectedRequest}
          onClose={() => setShowDetails(false)}
          onUpdate={loadRequests}
          onSlotUpdate={loadRequests} // Refresh requests when slots change
          showTakeRequestButton={true}
        />
      )}
    </div>
  );
};

export default ManageRequests;