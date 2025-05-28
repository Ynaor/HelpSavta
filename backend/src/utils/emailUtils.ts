import { 
  RequestCreatedTemplateData,
  StatusUpdateTemplateData,
  RequestCompletedTemplateData,
  BaseEmailTemplateData
} from '../types/emailTemplates';

/**
 * Utility functions for email template data generation
 * פונקציות עזר ליצירת נתוני תבניות אימייל
 */

// Hebrew labels for urgency levels
const URGENCY_LABELS: Record<string, string> = {
  'low': 'נמוכה',
  'medium': 'בינונית',
  'high': 'גבוהה',
  'urgent': 'דחוף'
};

// Hebrew labels for status
const STATUS_LABELS: Record<string, string> = {
  'pending': 'ממתין',
  'in_progress': 'בטיפול',
  'completed': 'הושלם',
  'cancelled': 'בוטל'
};

// Estimated response times based on urgency
const RESPONSE_TIMES: Record<string, string> = {
  'urgent': '24 שעות',
  'high': '48 שעות',
  'medium': '3-5 ימי עבודה',
  'low': '5-7 ימי עבודה'
};

// Next steps messages based on urgency
const NEXT_STEPS: Record<string, string> = {
  'urgent': 'המתנדב יצור איתכם קשר תוך 24 שעות לתיאום ביקור מיידי',
  'high': 'המתנדב יצור איתכם קשר תוך 48 שעות לתיאום מועד מתאים',
  'medium': 'המתנדב יצור איתכם קשר בימים הקרובים לתיאום מועד נוח',
  'low': 'המתנדב יצור איתכם קשר בשבוע הקרוב לתיאום מועד מתאים'
};

// Feedback messages for completed requests
const FEEDBACK_MESSAGES: Record<string, string> = {
  'urgent': 'תודה שאפשרתם לנו לטפל בבעיה הדחופה שלכם. אנו מקווים שהפתרון עונה על הצרכים שלכם.',
  'high': 'תודה על הסבלנות במהלך הטיפול בבעיה שלכם. אנו מקווים שהתוצאה מספקת.',
  'medium': 'תודה על הבחירה בשירות שלנו. אנו מקווים שהעזרה שקיבלתם תועיל לכם לטווח הארוך.',
  'low': 'תודה על הפנייה והסבלנות. אנו שמחים שיכולנו לעזור לכם עם הבעיה הטכנית.'
};

/**
 * Get base email template data with common information
 * קבלת נתוני תבנית אימייל בסיסיים עם מידע משותף
 */
export function getBaseEmailData(
  recipientName: string,
  recipientEmail: string
): BaseEmailTemplateData {
  return {
    recipientName,
    recipientEmail,
    supportEmail: process.env.SUPPORT_EMAIL || 'support@helpsavta.com',
    supportPhone: process.env.SUPPORT_PHONE || '03-1234567',
    organizationName: 'Help Savta'
  };
}

/**
 * Generate request created email template data
 * יצירת נתוני תבנית אימייל ליצירת בקשה
 */
export function generateRequestCreatedData(
  request: any,
  recipientName: string,
  recipientEmail: string
): RequestCreatedTemplateData {
  const baseData = getBaseEmailData(recipientName, recipientEmail);
  const urgencyLabel = URGENCY_LABELS[request.urgency_level] || request.urgency_level;
  const estimatedResponseTime = RESPONSE_TIMES[request.urgency_level] || '5-7 ימי עבודה';

  return {
    ...baseData,
    request: {
      id: request.id,
      full_name: request.full_name,
      phone: request.phone,
      email: request.email,
      address: request.address,
      problem_description: request.problem_description,
      urgency_level: request.urgency_level,
      created_at: request.created_at,
      notes: request.notes
    },
    urgencyLabel,
    estimatedResponseTime
  };
}

/**
 * Generate status update email template data
 * יצירת נתוני תבנית אימייל לעדכון סטטוס
 */
export function generateStatusUpdateData(
  request: any,
  admin: any | null,
  recipientName: string,
  recipientEmail: string
): StatusUpdateTemplateData {
  const baseData = getBaseEmailData(recipientName, recipientEmail);
  const urgencyLabel = URGENCY_LABELS[request.urgency_level] || request.urgency_level;
  const statusLabel = STATUS_LABELS[request.status] || request.status;
  const nextSteps = NEXT_STEPS[request.urgency_level] || 'המתנדב יצור איתכם קשר בהקדם';

  return {
    ...baseData,
    request: {
      id: request.id,
      full_name: request.full_name,
      phone: request.phone,
      email: request.email,
      address: request.address,
      problem_description: request.problem_description,
      urgency_level: request.urgency_level,
      status: request.status,
      created_at: request.created_at,
      updated_at: request.updated_at,
      notes: request.notes
    },
    admin: admin ? {
      id: admin.id,
      username: admin.username
    } : undefined,
    statusLabel,
    urgencyLabel,
    nextSteps
  };
}

/**
 * Generate request completed email template data
 * יצירת נתוני תבנית אימייל להשלמת בקשה
 */
export function generateRequestCompletedData(
  request: any,
  slot: any | null,
  admin: any | null,
  recipientName: string,
  recipientEmail: string
): RequestCompletedTemplateData {
  const baseData = getBaseEmailData(recipientName, recipientEmail);
  const urgencyLabel = URGENCY_LABELS[request.urgency_level] || request.urgency_level;
  const feedbackMessage = FEEDBACK_MESSAGES[request.urgency_level] || 'תודה על הבחירה בשירות שלנו.';
  
  // Format completion date
  const completionDate = new Date(request.updated_at).toLocaleDateString('he-IL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Jerusalem'
  });

  return {
    ...baseData,
    request: {
      id: request.id,
      full_name: request.full_name,
      phone: request.phone,
      email: request.email,
      address: request.address,
      problem_description: request.problem_description,
      urgency_level: request.urgency_level,
      status: request.status,
      created_at: request.created_at,
      updated_at: request.updated_at,
      notes: request.notes
    },
    slot: slot ? {
      id: slot.id,
      date: slot.date,
      start_time: slot.start_time,
      end_time: slot.end_time
    } : undefined,
    admin: admin ? {
      id: admin.id,
      username: admin.username
    } : undefined,
    urgencyLabel,
    completionDate,
    feedbackMessage
  };
}

/**
 * Get email subject based on template type and data
 * קבלת נושא האימייל בהתאם לסוג התבנית והנתונים
 */
export function getEmailSubject(
  templateType: 'request-created' | 'status-update' | 'request-completed',
  requestId: number,
  urgencyLevel?: string
): string {
  const urgencyPrefix = urgencyLevel === 'urgent' ? '[דחוף] ' : '';
  
  switch (templateType) {
    case 'request-created':
      return `${urgencyPrefix}בקשה #${requestId} התקבלה - Help Savta`;
    
    case 'status-update':
      return `${urgencyPrefix}עדכון בקשה #${requestId} - בטיפול - Help Savta`;
    
    case 'request-completed':
      return `בקשה #${requestId} הושלמה - Help Savta`;
    
    default:
      return `עדכון בקשה #${requestId} - Help Savta`;
  }
}

/**
 * Validate email template data
 * אימות נתוני תבנית אימייל
 */
export function validateEmailData(
  templateType: 'request-created' | 'status-update' | 'request-completed',
  data: any
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Base validation
  if (!data.recipientName) errors.push('recipientName is required');
  if (!data.recipientEmail) errors.push('recipientEmail is required');
  if (!data.request) errors.push('request data is required');
  
  if (data.request) {
    if (!data.request.id) errors.push('request.id is required');
    if (!data.request.full_name) errors.push('request.full_name is required');
    if (!data.request.problem_description) errors.push('request.problem_description is required');
  }

  // Template-specific validation
  switch (templateType) {
    case 'request-created':
      if (!data.urgencyLabel) errors.push('urgencyLabel is required for request-created');
      if (!data.estimatedResponseTime) errors.push('estimatedResponseTime is required for request-created');
      break;
      
    case 'status-update':
      if (!data.statusLabel) errors.push('statusLabel is required for status-update');
      if (!data.nextSteps) errors.push('nextSteps is required for status-update');
      break;
      
    case 'request-completed':
      if (!data.completionDate) errors.push('completionDate is required for request-completed');
      if (!data.feedbackMessage) errors.push('feedbackMessage is required for request-completed');
      break;
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}