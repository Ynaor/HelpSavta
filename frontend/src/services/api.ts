import axios, { AxiosResponse } from 'axios';
import {
  TechRequest,
  AvailableSlot,
  AdminUser,
  CreateTechRequestForm,
  CreateSlotForm,
  LoginForm,
  UpdateRequestForm,
  ApiResponse,
  PaginatedResponse,
  DashboardStats
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
      const message = error.response?.data?.message || error.response?.data?.error || error.message;
      throw new Error(message);
    }
    throw error;
  }
}

// Generic paginated API call wrapper
async function paginatedApiCall<T>(
  request: () => Promise<AxiosResponse<PaginatedResponse<T>>>
): Promise<PaginatedResponse<T>['data'] & { pagination: PaginatedResponse<T>['pagination'] }> {
  try {
    const response = await request();
    if (!response.data.success) {
      throw new Error(response.data.error || response.data.message || 'API call failed');
    }
    return {
      ...response.data.data,
      pagination: response.data.pagination
    } as any;
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
};

export default api;