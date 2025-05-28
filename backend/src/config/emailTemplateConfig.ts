/**
 * Email template configuration and integration example
 * הגדרות תבניות אימייל ודוגמה לשילוב
 */

import { templateService } from '../services/templateService';
import { 
  generateRequestCreatedData,
  generateStatusUpdateData,
  generateRequestCompletedData,
  getEmailSubject,
  validateEmailData
} from '../utils/emailUtils';
import type { EmailTemplateType } from '../types/emailTemplates';

/**
 * Email template configuration
 * הגדרות תבניות אימייל
 */
export const EMAIL_TEMPLATE_CONFIG = {
  // Default support contact information
  DEFAULT_SUPPORT: {
    email: process.env.SUPPORT_EMAIL || 'support@helpsavta.com',
    phone: process.env.SUPPORT_PHONE || '03-1234567'
  },

  // Template file mappings
  TEMPLATES: {
    'request-created': 'request-created.hbs',
    'status-update': 'status-update.hbs',
    'request-completed': 'request-completed.hbs'
  } as const,

  // Email subjects configuration
  SUBJECTS: {
    'request-created': (requestId: number, isUrgent: boolean) => 
      `${isUrgent ? '[דחוף] ' : ''}בקשה #${requestId} התקבלה - Help Savta`,
    'status-update': (requestId: number, isUrgent: boolean) => 
      `${isUrgent ? '[דחוף] ' : ''}עדכון בקשה #${requestId} - בטיפול - Help Savta`,
    'request-completed': (requestId: number) => 
      `בקשה #${requestId} הושלמה - Help Savta`
  }
};

/**
 * Render email using template service
 * עיבוד אימייל באמצעות שירות התבניות
 */
export async function renderEmailTemplate(
  templateType: EmailTemplateType,
  request: any,
  admin?: any,
  slot?: any
): Promise<{ html: string; text: string; subject: string } | null> {
  try {
    // Check if template service is ready
    if (!templateService.isReady()) {
      console.error('❌ Template service is not ready');
      return null;
    }

    let templateData;
    let subject;

    // Generate data based on template type
    switch (templateType) {
      case 'request-created':
        templateData = generateRequestCreatedData(
          request,
          request.full_name,
          request.email
        );
        subject = getEmailSubject(templateType, request.id, request.urgency_level);
        break;

      case 'status-update':
        templateData = generateStatusUpdateData(
          request,
          admin,
          request.full_name,
          request.email
        );
        subject = getEmailSubject(templateType, request.id, request.urgency_level);
        break;

      case 'request-completed':
        templateData = generateRequestCompletedData(
          request,
          slot,
          admin,
          request.full_name,
          request.email
        );
        subject = getEmailSubject(templateType, request.id, request.urgency_level);
        break;

      default:
        throw new Error(`Unknown template type: ${templateType}`);
    }

    // Validate template data
    const validation = validateEmailData(templateType, templateData);
    if (!validation.isValid) {
      console.error('❌ Template data validation failed:', validation.errors);
      return null;
    }

    // Render template
    const { html, text } = templateService.renderTemplate(
      templateType,
      templateData,
      subject
    );

    return { html, text, subject };

  } catch (error) {
    console.error(`❌ Error rendering email template ${templateType}:`, error);
    return null;
  }
}

/**
 * Example integration with existing email service
 * דוגמה לשילוב עם שירות האימייל הקיים
 */
export const EMAIL_INTEGRATION_EXAMPLE = `
// Example of how to integrate with existing emailService.ts:

import { renderEmailTemplate } from './config/emailTemplateConfig';

// Replace the hardcoded HTML in sendApprovalEmail:
const emailContent = await renderEmailTemplate('request-created', request);
if (emailContent) {
  const mailOptions = {
    from: \`"Help Savta" <\${process.env.EMAIL_USER}>\`,
    to: recipientEmail,
    subject: emailContent.subject,
    text: emailContent.text,
    html: emailContent.html
  };
  
  await this.transporter.sendMail(mailOptions);
}

// Replace the hardcoded HTML in sendStatusUpdateEmail:
const emailContent = await renderEmailTemplate('status-update', request, admin);
if (emailContent) {
  const mailOptions = {
    from: \`"Help Savta" <\${process.env.EMAIL_USER}>\`,
    to: recipientEmail,
    subject: emailContent.subject,
    text: emailContent.text,
    html: emailContent.html
  };
  
  await this.transporter.sendMail(mailOptions);
}

// New method for completion emails:
async sendCompletionEmail(request: any, admin?: any, slot?: any): Promise<boolean> {
  const emailContent = await renderEmailTemplate('request-completed', request, admin, slot);
  if (!emailContent) return false;
  
  const mailOptions = {
    from: \`"Help Savta" <\${process.env.EMAIL_USER}>\`,
    to: request.email,
    subject: emailContent.subject,
    text: emailContent.text,
    html: emailContent.html
  };
  
  try {
    await this.transporter.sendMail(mailOptions);
    await this.logNotification('email', request.email, 
      \`Completion email sent for request #\${request.id}\`, 'sent');
    return true;
  } catch (error) {
    console.error('❌ Failed to send completion email:', error);
    await this.logNotification('email', request.email, 
      \`Failed to send completion email for request #\${request.id}\`, 'failed');
    return false;
  }
}
`;

/**
 * Development utilities
 * כלי עזר לפיתוח
 */
export const DEV_UTILITIES = {
  /**
   * Test template rendering without sending email
   * בדיקת עיבוד תבנית ללא שליחת אימייל
   */
  async testTemplate(
    templateType: EmailTemplateType,
    mockRequest: any,
    mockAdmin?: any,
    mockSlot?: any
  ): Promise<void> {
    console.log(`🧪 Testing template: ${templateType}`);
    
    const result = await renderEmailTemplate(templateType, mockRequest, mockAdmin, mockSlot);
    
    if (result) {
      console.log('✅ Template rendered successfully');
      console.log('📧 Subject:', result.subject);
      console.log('📝 Text length:', result.text.length);
      console.log('🌐 HTML length:', result.html.length);
    } else {
      console.log('❌ Template rendering failed');
    }
  },

  /**
   * Get template service status
   * קבלת סטטוס שירות התבניות
   */
  getTemplateServiceStatus(): object {
    return {
      isReady: templateService.isReady(),
      availableTemplates: templateService.getAvailableTemplates(),
      templatesPath: templateService['templatesPath'] // Access private property for debugging
    };
  }
};