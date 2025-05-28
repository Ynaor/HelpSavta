import * as fs from 'fs';
import * as path from 'path';
import Handlebars from 'handlebars';
import { 
  EmailTemplateType, 
  EmailTemplateContext,
  RequestCreatedTemplateData,
  StatusUpdateTemplateData,
  RequestCompletedTemplateData
} from '../types/emailTemplates';

/**
 * Email template service for rendering HTML emails using Handlebars
 * שירות תבניות אימייל לעיבוד HTML באמצעות Handlebars
 */
class TemplateService {
  private templates: Map<string, HandlebarsTemplateDelegate> = new Map();
  private baseTemplate: HandlebarsTemplateDelegate | null = null;
  private templatesPath: string;

  constructor() {
    this.templatesPath = path.join(__dirname, '../templates/email');
    this.registerHelpers();
    this.loadTemplates();
  }

  /**
   * Register Handlebars helpers
   * רישום עוזרי Handlebars
   */
  private registerHelpers(): void {
    // Helper for formatting dates in Hebrew
    Handlebars.registerHelper('formatDate', (dateString: string) => {
      if (!dateString) return '';
      
      try {
        const date = new Date(dateString);
        const options: Intl.DateTimeFormatOptions = {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'Asia/Jerusalem'
        };
        
        return date.toLocaleDateString('he-IL', options);
      } catch (error) {
        console.error('Error formatting date:', error);
        return dateString;
      }
    });

    // Helper for formatting time only
    Handlebars.registerHelper('formatTime', (timeString: string) => {
      if (!timeString) return '';
      return timeString.substring(0, 5); // Extract HH:MM from HH:MM:SS
    });

    // Helper for urgency level translation
    Handlebars.registerHelper('urgencyLabel', (urgencyLevel: string) => {
      const labels: Record<string, string> = {
        'low': 'נמוכה',
        'medium': 'בינונית', 
        'high': 'גבוהה',
        'urgent': 'דחוף'
      };
      return labels[urgencyLevel] || urgencyLevel;
    });

    // Helper for status translation
    Handlebars.registerHelper('statusLabel', (status: string) => {
      const labels: Record<string, string> = {
        'pending': 'ממתין',
        'in_progress': 'בטיפול',
        'completed': 'הושלם',
        'cancelled': 'בוטל'
      };
      return labels[status] || status;
    });
  }

  /**
   * Load all templates from the templates directory
   * טעינת כל התבניות מתיקיית התבניות
   */
  private loadTemplates(): void {
    try {
      // Load base template
      const baseTemplatePath = path.join(this.templatesPath, 'base.hbs');
      if (fs.existsSync(baseTemplatePath)) {
        const baseTemplateSource = fs.readFileSync(baseTemplatePath, 'utf8');
        this.baseTemplate = Handlebars.compile(baseTemplateSource);
        console.log('📧 Base email template loaded successfully');
      }

      // Load content templates
      const templateFiles = [
        'request-created.hbs',
        'status-update.hbs', 
        'request-completed.hbs'
      ];

      for (const templateFile of templateFiles) {
        const templatePath = path.join(this.templatesPath, templateFile);
        if (fs.existsSync(templatePath)) {
          const templateSource = fs.readFileSync(templatePath, 'utf8');
          const template = Handlebars.compile(templateSource);
          const templateName = templateFile.replace('.hbs', '');
          this.templates.set(templateName, template);
          console.log(`📧 Email template loaded: ${templateName}`);
        } else {
          console.warn(`⚠️ Template file not found: ${templateFile}`);
        }
      }
    } catch (error) {
      console.error('❌ Error loading email templates:', error);
    }
  }

  /**
   * Render email template with data
   * עיבוד תבנית אימייל עם נתונים
   */
  public renderTemplate(
    templateType: EmailTemplateType,
    data: RequestCreatedTemplateData | StatusUpdateTemplateData | RequestCompletedTemplateData,
    subject: string
  ): { html: string; text: string } {
    try {
      const template = this.templates.get(templateType);
      if (!template) {
        throw new Error(`Template not found: ${templateType}`);
      }

      if (!this.baseTemplate) {
        throw new Error('Base template not loaded');
      }

      // Render the content template
      const content = template(data);

      // Render the base template with the content
      const html = this.baseTemplate({
        subject,
        content,
        ...data
      });

      // Generate plain text version (simplified)
      const text = this.generateTextVersion(templateType, data);

      return { html, text };
    } catch (error) {
      console.error(`❌ Error rendering template ${templateType}:`, error);
      throw new Error(`Failed to render email template: ${templateType}`);
    }
  }

  /**
   * Generate plain text version of email
   * יצירת גרסת טקסט פשוט של האימייל
   */
  private generateTextVersion(
    templateType: EmailTemplateType,
    data: RequestCreatedTemplateData | StatusUpdateTemplateData | RequestCompletedTemplateData
  ): string {
    const { recipientName } = data;
    
    switch (templateType) {
      case 'request-created':
        const requestData = data as RequestCreatedTemplateData;
        return `
שלום ${recipientName},

תודה רבה על פנייתך לשירות Help Savta!

פרטי הבקשה:
מספר בקשה: #${requestData.request.id}
שם מלא: ${requestData.request.full_name}
טלפון: ${requestData.request.phone}
כתובת: ${requestData.request.address}
רמת דחיפות: ${requestData.urgencyLabel}
תיאור הבעיה: ${requestData.request.problem_description}

נחזור אליך תוך ${requestData.estimatedResponseTime}.

בברכה,
צוות Help Savta
        `.trim();

      case 'status-update':
        const statusData = data as StatusUpdateTemplateData;
        return `
שלום ${recipientName},

אנו שמחים לעדכן אותך שבקשתך החלה להיות מטופלת!

פרטי הבקשה:
מספר בקשה: #${statusData.request.id}
סטטוס: ${statusData.statusLabel}
${statusData.admin ? `מטפל: ${statusData.admin.username}` : ''}

השלבים הבאים: ${statusData.nextSteps}

בברכה,
צוות Help Savta
        `.trim();

      case 'request-completed':
        const completedData = data as RequestCompletedTemplateData;
        return `
שלום ${recipientName},

אנו שמחים לעדכן אותך שהבקשה שלך הושלמה בהצלחה!

פרטי הבקשה:
מספר בקשה: #${completedData.request.id}
תאריך השלמה: ${completedData.completionDate}
${completedData.admin ? `המתנדב שטיפל: ${completedData.admin.username}` : ''}

${completedData.feedbackMessage}

תודה שבחרת בשירות Help Savta!

בברכה,
צוות Help Savta
        `.trim();

      default:
        throw new Error(`Unknown template type: ${templateType}`);
    }
  }

  /**
   * Get available template types
   * קבלת סוגי התבניות הזמינות
   */
  public getAvailableTemplates(): string[] {
    return Array.from(this.templates.keys());
  }

  /**
   * Check if template service is ready
   * בדיקה אם שירות התבניות מוכן
   */
  public isReady(): boolean {
    return this.baseTemplate !== null && this.templates.size > 0;
  }

  /**
   * Reload all templates (useful for development)
   * טעינה מחדש של כל התבניות (שימושי לפיתוח)
   */
  public reloadTemplates(): void {
    this.templates.clear();
    this.baseTemplate = null;
    this.loadTemplates();
  }
}

// Export singleton instance
export const templateService = new TemplateService();