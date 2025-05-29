import axios, { AxiosResponse } from 'axios';
import {
  TechRequest,
  AvailableSlot,
  AdminUser,
  NotificationLog,
  CreateTechRequestForm,
  CreateSlotForm,
  LoginForm,
  UpdateRequestForm,
  AdminRequestUpdateForm,
  TakeRequestForm,
  ApiResponse,
  PaginatedResponse,
  DashboardStats,
  CalendarDataResponse,
  CalendarQueryParams
} from '../types';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  withCredentials: true, // Important for session cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - redirect to login
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

// Generic API call wrapper
async function apiCall<T>(
  request: () => Promise<AxiosResponse<ApiResponse<T>>>
): Promise<T> {
  try {
    const response = await request();
    if (!response.data.success) {
      throw new Error(response.data.error || response.data.message || 'API call failed');
    }
    return response.data.data as T;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('API Error Response:', error.response?.data);
      const message = error.response?.data?.message || error.response?.data?.error || error.message;
      // If validation errors exist, include them in the message
      if (error.response?.data?.details) {
        const validationErrors = error.response.data.details.map((detail: any) =>
          `${detail.field}: ${detail.message}`
        ).join(', ');
        throw new Error(`${message} - ${validationErrors}`);
      }
      throw new Error(message);
    }
    throw error;
  }
}

// Generic paginated API call wrapper
async function paginatedApiCall<T>(
  request: () => Promise<AxiosResponse<PaginatedResponse<T>>>
): Promise<T[]> {
  try {
    const response = await request();
    if (!response.data.success) {
      throw new Error(response.data.error || response.data.message || 'API call failed');
    }
    // Return just the data array, not the pagination info
    return response.data.data || [];
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message || error.response?.data?.error || error.message;
      throw new Error(message);
    }
    throw error;
  }
}

// Auth API
export const authAPI = {
  login: (credentials: LoginForm) => 
    apiCall(() => api.post<ApiResponse<AdminUser>>('/auth/login', credentials)),
  
  logout: () => 
    apiCall(() => api.post<ApiResponse<null>>('/auth/logout')),
  
  me: () => 
    apiCall(() => api.get<ApiResponse<AdminUser>>('/auth/me')),
  
  status: () => 
    apiCall(() => api.get<ApiResponse<{ authenticated: boolean; user: AdminUser | null }>>('/auth/status')),
};

// Requests API
export const requestsAPI = {
  getAll: (params?: {
    status?: string;
    urgency_level?: string;
    page?: number;
    limit?: number;
  }) => 
    paginatedApiCall(() => api.get<PaginatedResponse<TechRequest>>('/requests', { params })),
  
  getById: (id: number) => 
    apiCall(() => api.get<ApiResponse<TechRequest>>(`/requests/${id}`)),
  
  create: (data: CreateTechRequestForm) => 
    apiCall(() => api.post<ApiResponse<TechRequest>>('/requests', data)),
  
  update: (id: number, data: UpdateRequestForm) => 
    apiCall(() => api.put<ApiResponse<TechRequest>>(`/requests/${id}`, data)),
  
  delete: (id: number) => 
    apiCall(() => api.delete<ApiResponse<null>>(`/requests/${id}`)),
};

// Slots API
export const slotsAPI = {
  getAll: (params?: {
    date?: string;
    is_booked?: boolean;
    page?: number;
    limit?: number;
  }) =>
    paginatedApiCall(() => api.get<PaginatedResponse<AvailableSlot>>('/slots', { params })),
  
  getAvailable: (date?: string) =>
    apiCall(() => api.get<ApiResponse<AvailableSlot[]>>('/slots/available', {
      params: date ? { date } : {}
    })),
  
  create: (data: CreateSlotForm) =>
    apiCall(() => api.post<ApiResponse<AvailableSlot>>('/slots', data)),
  
  book: (slotId: number, requestId: number) =>
    apiCall(() => api.put<ApiResponse<{ slot: AvailableSlot; request: TechRequest }>>(`/slots/${slotId}/book`, {
      request_id: requestId
    })),
  
  delete: (id: number) =>
    apiCall(() => api.delete<ApiResponse<null>>(`/slots/${id}`)),

  // Get slot with detailed information including associated requests
  getById: (id: number) =>
    apiCall(() => api.get<ApiResponse<AvailableSlot>>(`/slots/${id}`)),

  // Release a booked slot (make it available again)
  release: (id: number) =>
    apiCall(() => api.put<ApiResponse<AvailableSlot>>(`/slots/${id}/release`)),
};

// Admin API
export const adminAPI = {
  getDashboard: () => 
    apiCall(() => api.get<ApiResponse<DashboardStats>>('/admin/dashboard')),
  
  getRequests: (params?: {
    status?: string;
    urgency_level?: string;
    date_from?: string;
    date_to?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => 
    paginatedApiCall(() => api.get<PaginatedResponse<TechRequest>>('/admin/requests', { params })),
  
  createBulkSlots: (data: {
    dates: string[];
    start_time: string;
    end_time: string;
  }) => 
    apiCall(() => api.post<ApiResponse<{ created: number }>>('/admin/slots/bulk', data)),
  
  createAdmin: (data: { username: string; password: string }) =>
    apiCall(() => api.post<ApiResponse<AdminUser>>('/admin/create-admin', data)),
  
  getNotifications: (params?: {
    type?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) =>
    paginatedApiCall(() => api.get<PaginatedResponse<NotificationLog>>('/admin/notifications', { params })),
  
  resendNotification: (id: number) =>
    apiCall(() => api.post<ApiResponse<NotificationLog>>(`/admin/notifications/${id}/resend`)),
  
  getAdmins: () =>
    apiCall(() => api.get<ApiResponse<AdminUser[]>>('/admin/admins')),
  
  deleteAdmin: (id: number) =>
    apiCall(() => api.delete<ApiResponse<null>>(`/admin/admins/${id}`)),

  // Admin request field editing
  updateRequestAsAdmin: (id: number, data: AdminRequestUpdateForm) =>
    apiCall(() => api.put<ApiResponse<TechRequest>>(`/admin/requests/${id}`, data)),

  // Admin takes a request (assigns themselves)
  takeRequest: (id: number, data?: TakeRequestForm) =>
    apiCall(() => api.post<ApiResponse<TechRequest>>(`/admin/requests/${id}/take`, data || {})),

  // Get comprehensive data (requests + slots) for dashboard refresh
  getComprehensiveData: () =>
    apiCall(() => api.get<ApiResponse<{
      requests: TechRequest[];
      slots: AvailableSlot[];
      stats: DashboardStats;
    }>>('/admin/comprehensive-data')),

  // Calendar API
  getCalendarData: (params: CalendarQueryParams) => {
    console.log('🌐 [API] Calling calendar API with params:', params);
    return apiCall(() => api.get<ApiResponse<CalendarDataResponse>>('/admin/calendar-data', { params }));
  },
};

export default api;