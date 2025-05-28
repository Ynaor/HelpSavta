/**
 * Email template data interfaces
 * ממשקי נתונים לתבניות אימייל
 */

export interface BaseEmailTemplateData {
  recipientName: string;
  recipientEmail: string;
  supportEmail?: string;
  supportPhone?: string;
  organizationName: string;
}

export interface RequestCreatedTemplateData extends BaseEmailTemplateData {
  request: {
    id: number;
    full_name: string;
    phone: string;
    email: string;
    address: string;
    problem_description: string;
    urgency_level: 'low' | 'medium' | 'high' | 'urgent';
    created_at: string;
    notes?: string;
  };
  urgencyLabel: string;
  estimatedResponseTime: string;
}

export interface StatusUpdateTemplateData extends BaseEmailTemplateData {
  request: {
    id: number;
    full_name: string;
    phone: string;
    email: string;
    address: string;
    problem_description: string;
    urgency_level: 'low' | 'medium' | 'high' | 'urgent';
    status: 'in_progress';
    created_at: string;
    updated_at: string;
    notes?: string;
  };
  admin?: {
    id: number;
    username: string;
  };
  statusLabel: string;
  urgencyLabel: string;
  nextSteps: string;
}

export interface RequestCompletedTemplateData extends BaseEmailTemplateData {
  request: {
    id: number;
    full_name: string;
    phone: string;
    email: string;
    address: string;
    problem_description: string;
    urgency_level: 'low' | 'medium' | 'high' | 'urgent';
    status: 'completed';
    created_at: string;
    updated_at: string;
    notes?: string;
  };
  slot?: {
    id: number;
    date: string;
    start_time: string;
    end_time: string;
  };
  admin?: {
    id: number;
    username: string;
  };
  urgencyLabel: string;
  completionDate: string;
  feedbackMessage: string;
}

// Helper type for template rendering
export type EmailTemplateType = 'request-created' | 'status-update' | 'request-completed';

export interface EmailTemplateContext {
  templateType: EmailTemplateType;
  data: RequestCreatedTemplateData | StatusUpdateTemplateData | RequestCompletedTemplateData;
  subject: string;
}