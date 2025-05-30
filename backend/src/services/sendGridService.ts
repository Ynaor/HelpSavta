import sgMail from '@sendgrid/mail';
import { prisma } from '../server';
import { renderEmailTemplate } from '../config/emailTemplateConfig';
import { templateService } from './templateService';

interface SendGridConfig {
  apiKey: string;
  fromEmail: string;
  fromName: string;
  replyToEmail?: string;
}

interface EmailQueue {
  id: string;
  recipientEmail: string;
  templateType: string;
  data: any;
  retryCount: number;
  maxRetries: number;
  scheduledAt: Date;
}

class SendGridEmailService {
  private isConfigured = false;
  private config: SendGridConfig | null = null;
  private emailQueue: Map<string, EmailQueue> = new Map();
  private retryDelays = [1000, 5000, 15000, 60000]; // 1s, 5s, 15s, 1min

  constructor() {
    this.initializeSendGrid();
  }

  private initializeSendGrid(): void {
    try {
      const apiKey = process.env.SENDGRID_API_KEY;
      const fromEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@helpsavta.com';
      const fromName = process.env.EMAIL_FROM_NAME || 'Help Savta';
      const replyToEmail = process.env.EMAIL_REPLY_TO || process.env.SUPPORT_EMAIL;

      if (!apiKey) {
        console.log('📧 SendGrid not configured - missing SENDGRID_API_KEY');
        return;
      }

      if (!fromEmail) {
        console.log('📧 SendGrid not configured - missing EMAIL_FROM');
        return;
      }

      // Validate API key format
      if (!apiKey.startsWith('SG.')) {
        console.warn('⚠️ SendGrid API key format may be invalid (should start with "SG.")');
      }

      sgMail.setApiKey(apiKey);

      this.config = {
        apiKey,
        fromEmail,
        fromName,
        replyToEmail
      };

      this.isConfigured = true;
      console.log('📧 SendGrid service configured successfully');
      console.log(`   From: "${fromName}" <${fromEmail}>`);
      if (replyToEmail) {
        console.log(`   Reply-To: ${replyToEmail}`);
      }
    } catch (error) {
      console.error('❌ Failed to configure SendGrid service:', error);
    }
  }

  /**
   * Send request created email using SendGrid
   */
  async sendRequestCreatedEmail(request: any): Promise<boolean> {
    if (!this.isConfigured || !this.config) {
      console.log('📧 SendGrid not configured - logging notification instead');
      await this.logNotification('email', request.email, 
        `Request created email for #${request.id}`, 'not_sent');
      return false;
    }

    try {
      const emailContent = await renderEmailTemplate('request-created', request);
      if (!emailContent) {
        console.warn('⚠️ Failed to render template - falling back to basic email');
        return await this.sendBasicRequestCreatedEmail(request);
      }

      const msg = {
        to: request.email,
        from: {
          email: this.config.fromEmail,
          name: this.config.fromName
        },
        replyTo: this.config.replyToEmail,
        subject: emailContent.subject,
        text: emailContent.text,
        html: emailContent.html,
        trackingSettings: {
          clickTracking: {
            enable: false
          },
          openTracking: {
            enable: false
          }
        },
        customArgs: {
          requestId: request.id.toString(),
          templateType: 'request-created'
        }
      };

      await sgMail.send(msg);
      
      await this.logNotification('email', request.email, 
        `Request created email sent for #${request.id}`, 'sent');
      
      console.log(`📧 SendGrid: Request created email sent to ${request.email}`);
      return true;
    } catch (error) {
      console.error('❌ SendGrid error sending request created email:', error);
      
      // Handle specific SendGrid errors
      if (this.isRetryableError(error)) {
        await this.addToQueue('request-created', request.email, { request });
      }
      
      await this.logNotification('email', request.email, 
        `Failed to send request created email for #${request.id}: ${error.message}`, 'failed');
      
      return false;
    }
  }

  /**
   * Send status update email using SendGrid
   */
  async sendStatusUpdateEmail(request: any, admin?: any): Promise<boolean> {
    if (!this.isConfigured || !this.config) {
      console.log('📧 SendGrid not configured - logging notification instead');
      await this.logNotification('email', request.email,
        `Status update email for #${request.id}`, 'not_sent');
      return false;
    }

    try {
      const emailContent = await renderEmailTemplate('status-update', request, admin);
      if (!emailContent) {
        console.warn('⚠️ Failed to render template - falling back to basic email');
        return await this.sendBasicStatusUpdateEmail(request, admin);
      }

      const msg = {
        to: request.email,
        from: {
          email: this.config.fromEmail,
          name: this.config.fromName
        },
        replyTo: this.config.replyToEmail,
        subject: emailContent.subject,
        text: emailContent.text,
        html: emailContent.html,
        trackingSettings: {
          clickTracking: {
            enable: false
          },
          openTracking: {
            enable: false
          }
        },
        customArgs: {
          requestId: request.id.toString(),
          templateType: 'status-update'
        }
      };

      await sgMail.send(msg);
      
      await this.logNotification('email', request.email,
        `Status update email sent for #${request.id}`, 'sent');
      
      console.log(`📧 SendGrid: Status update email sent to ${request.email}`);
      return true;
    } catch (error) {
      console.error('❌ SendGrid error sending status update email:', error);
      
      if (this.isRetryableError(error)) {
        await this.addToQueue('status-update', request.email, { request, admin });
      }
      
      await this.logNotification('email', request.email,
        `Failed to send status update email for #${request.id}: ${error.message}`, 'failed');
      
      return false;
    }
  }

  /**
   * Send request completed email using SendGrid
   */
  async sendRequestCompletedEmail(request: any, admin?: any, slot?: any): Promise<boolean> {
    if (!this.isConfigured || !this.config) {
      console.log('📧 SendGrid not configured - logging notification instead');
      await this.logNotification('email', request.email,
        `Request completed email for #${request.id}`, 'not_sent');
      return false;
    }

    try {
      const emailContent = await renderEmailTemplate('request-completed', request, admin, slot);
      if (!emailContent) {
        console.warn('⚠️ Failed to render template - falling back to basic email');
        return await this.sendBasicCompletedEmail(request, admin, slot);
      }

      const msg = {
        to: request.email,
        from: {
          email: this.config.fromEmail,
          name: this.config.fromName
        },
        replyTo: this.config.replyToEmail,
        subject: emailContent.subject,
        text: emailContent.text,
        html: emailContent.html,
        trackingSettings: {
          clickTracking: {
            enable: false
          },
          openTracking: {
            enable: false
          }
        },
        customArgs: {
          requestId: request.id.toString(),
          templateType: 'request-completed'
        }
      };

      await sgMail.send(msg);
      
      await this.logNotification('email', request.email,
        `Request completed email sent for #${request.id}`, 'sent');
      
      console.log(`📧 SendGrid: Request completed email sent to ${request.email}`);
      return true;
    } catch (error) {
      console.error('❌ SendGrid error sending request completed email:', error);
      
      if (this.isRetryableError(error)) {
        await this.addToQueue('request-completed', request.email, { request, admin, slot });
      }
      
      await this.logNotification('email', request.email,
        `Failed to send request completed email for #${request.id}: ${error.message}`, 'failed');
      
      return false;
    }
  }

  /**
   * Send email verification
   */
  async sendEmailVerification(email: string, verificationToken: string, baseUrl: string): Promise<boolean> {
    if (!this.isConfigured || !this.config) {
      console.log('📧 SendGrid not configured - cannot send verification email');
      return false;
    }

    try {
      const verificationUrl = `${baseUrl}/verify-email?token=${verificationToken}`;
      
      const subject = 'אימות כתובת אימייל - Help Savta';
      const htmlContent = `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">אימות כתובת אימייל</h2>
          <p>לחץ על הקישור הבא לאימות כתובת האימייל שלך:</p>
          <div style="text-align: center; margin: 20px 0;">
            <a href="${verificationUrl}" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
              אמת אימייל
            </a>
          </div>
          <p>אם לא ביקשת אימות זה, אנא התעלם מאימייל זה.</p>
          <p>בברכה,<br>צוות Help Savta</p>
        </div>
      `;

      const textContent = `
אימות כתובת אימייל - Help Savta

לאימות כתובת האימייל שלך, עבור לקישור הבא:
${verificationUrl}

אם לא ביקשת אימות זה, אנא התעלם מאימייל זה.

בברכה,
צוות Help Savta
      `;

      const msg = {
        to: email,
        from: {
          email: this.config.fromEmail,
          name: this.config.fromName
        },
        subject,
        text: textContent,
        html: htmlContent,
        trackingSettings: {
          clickTracking: {
            enable: true
          },
          openTracking: {
            enable: false
          }
        },
        customArgs: {
          templateType: 'email-verification'
        }
      };

      await sgMail.send(msg);
      
      await this.logNotification('email', email, 
        'Email verification sent', 'sent');
      
      console.log(`📧 SendGrid: Email verification sent to ${email}`);
      return true;
    } catch (error) {
      console.error('❌ SendGrid error sending verification email:', error);
      
      await this.logNotification('email', email, 
        `Failed to send email verification: ${error.message}`, 'failed');
      
      return false;
    }
  }

  /**
   * Send test email
   */
  async sendTestEmail(templateType: 'request-created' | 'status-update' | 'request-completed' | 'basic', recipientEmail: string): Promise<boolean> {
    if (!this.isConfigured || !this.config) {
      console.log('📧 SendGrid not configured - cannot send test email');
      return false;
    }

    try {
      let subject: string;
      let htmlContent: string;
      let textContent: string;

      if (templateType === 'basic') {
        subject = '[בדיקה] SendGrid Integration - Help Savta';
        htmlContent = `
          <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">✅ SendGrid פועל תקין!</h2>
            <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-right: 4px solid #22c55e;">
              <p><strong>שירות SendGrid מחובר בהצלחה</strong></p>
              <p>מערכת האימייל עם תמיכה מלאה בעברית RTL פועלת כמו שצריך.</p>
            </div>
            <p>פרטי הבדיקה:</p>
            <ul>
              <li>שירות: SendGrid API</li>
              <li>כיוון טקסט: RTL (ימין לשמאל)</li>
              <li>קידוד: UTF-8</li>
              <li>תאריך בדיקה: ${new Date().toLocaleString('he-IL')}</li>
            </ul>
            <p>בברכה,<br>צוות Help Savta</p>
          </div>
        `;
        textContent = `
[בדיקה] SendGrid Integration - Help Savta

✅ SendGrid פועל תקין!

שירות SendGrid מחובר בהצלחה עם תמיכה מלאה בעברית RTL.

פרטי הבדיקה:
- שירות: SendGrid API
- כיוון טקסט: RTL (ימין לשמאל)
- קידוד: UTF-8
- תאריך בדיקה: ${new Date().toLocaleString('he-IL')}

בברכה,
צוות Help Savta
        `;
      } else {
        // Use template service for other types
        const mockRequest = {
          id: 999,
          full_name: 'משתמש בדיקה',
          phone: '050-9999999',
          email: recipientEmail,
          address: 'כתובת בדיקה 123, עיר הבדיקה',
          problem_description: 'זהו אימייל בדיקה למערכת Help Savta.',
          urgency_level: 'medium',
          status: templateType === 'request-created' ? 'pending' : 'in_progress',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          notes: 'זהו אימייל בדיקה - לא מדובר בבקשה אמיתית'
        };

        const mockAdmin = {
          id: 999,
          username: 'מתנדב בדיקה'
        };

        const mockSlot = {
          id: 999,
          date: new Date().toISOString().split('T')[0],
          start_time: '10:00',
          end_time: '12:00'
        };

        const emailContent = await renderEmailTemplate(templateType, mockRequest, mockAdmin, mockSlot);
        if (!emailContent) {
          throw new Error('Failed to render test template');
        }

        subject = `[בדיקה] ${emailContent.subject}`;
        htmlContent = emailContent.html;
        textContent = `זהו אימייל בדיקה!\n\n${emailContent.text}`;
      }

      const msg = {
        to: recipientEmail,
        from: {
          email: this.config.fromEmail,
          name: `${this.config.fromName} (בדיקה)`
        },
        replyTo: this.config.replyToEmail,
        subject,
        text: textContent,
        html: htmlContent,
        trackingSettings: {
          clickTracking: {
            enable: false
          },
          openTracking: {
            enable: false
          }
        },
        customArgs: {
          templateType: `test-${templateType}`
        }
      };

      await sgMail.send(msg);
      
      console.log(`📧 SendGrid: Test email sent to ${recipientEmail}`);
      return true;
    } catch (error) {
      console.error('❌ SendGrid error sending test email:', error);
      return false;
    }
  }

  /**
   * Process email queue with retry logic
   */
  async processEmailQueue(): Promise<void> {
    for (const [queueId, queueItem] of this.emailQueue.entries()) {
      if (queueItem.scheduledAt <= new Date()) {
        console.log(`📧 Processing queued email: ${queueId}`);
        
        let success = false;
        try {
          switch (queueItem.templateType) {
            case 'request-created':
              success = await this.sendRequestCreatedEmail(queueItem.data.request);
              break;
            case 'status-update':
              success = await this.sendStatusUpdateEmail(queueItem.data.request, queueItem.data.admin);
              break;
            case 'request-completed':
              success = await this.sendRequestCompletedEmail(queueItem.data.request, queueItem.data.admin, queueItem.data.slot);
              break;
          }
        } catch (error) {
          console.error(`❌ Error processing queued email ${queueId}:`, error);
        }

        if (success) {
          console.log(`✅ Queued email processed successfully: ${queueId}`);
          this.emailQueue.delete(queueId);
        } else {
          queueItem.retryCount++;
          if (queueItem.retryCount >= queueItem.maxRetries) {
            console.error(`❌ Max retries reached for queued email: ${queueId}`);
            this.emailQueue.delete(queueId);
          } else {
            const delay = this.retryDelays[Math.min(queueItem.retryCount - 1, this.retryDelays.length - 1)] || 60000;
            queueItem.scheduledAt = new Date(Date.now() + delay);
            console.log(`🔄 Scheduling retry ${queueItem.retryCount}/${queueItem.maxRetries} for ${queueId} in ${delay}ms`);
          }
        }
      }
    }
  }

  /**
   * Test SendGrid connection
   */
  async testConnection(): Promise<boolean> {
    if (!this.isConfigured || !this.config) {
      return false;
    }

    try {
      // SendGrid doesn't have a direct "test connection" method like SMTP
      // Instead, we'll try to send a test email to a non-existent domain
      // and check if we get a proper API response (even if it's an error)
      
      console.log('📧 Testing SendGrid connection...');
      
      // Just check if the API key is accepted by making a simple call
      const testMsg = {
        to: 'test@invalid-domain-for-testing.invalid',
        from: this.config.fromEmail,
        subject: 'Connection Test',
        text: 'This is a connection test'
      };

      try {
        await sgMail.send(testMsg);
        console.log('📧 SendGrid connection test successful');
        return true;
      } catch (error: any) {
        // If we get a SendGrid API error (not a network error), it means we're connected
        if (error.code && error.code >= 400 && error.code < 500) {
          console.log('📧 SendGrid connection test successful (API responded)');
          return true;
        }
        throw error;
      }
    } catch (error) {
      console.error('❌ SendGrid connection test failed:', error);
      return false;
    }
  }

  /**
   * Fallback methods for basic emails
   */
  private async sendBasicRequestCreatedEmail(request: any): Promise<boolean> {
    const subject = `בקשה #${request.id} התקבלה - Help Savta`;
    const htmlContent = `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">שלום ${request.full_name},</h2>
        <p>תודה על פנייתך לשירות Help Savta!</p>
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>פרטי הבקשה:</h3>
          <p><strong>מספר בקשה:</strong> #${request.id}</p>
          <p><strong>תיאור הבעיה:</strong> ${request.problem_description}</p>
        </div>
        <p>נחזור אליך בהקדם האפשרי.</p>
        <p>בברכה,<br>צוות Help Savta</p>
      </div>
    `;

    return this.sendBasicEmail(request.email, subject, htmlContent);
  }

  private async sendBasicStatusUpdateEmail(request: any, admin?: any): Promise<boolean> {
    const subject = `עדכון בקשה #${request.id} - Help Savta`;
    const htmlContent = `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">שלום ${request.full_name},</h2>
        <p>יש עדכון חדש לבקשתך!</p>
        <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>מספר בקשה:</strong> #${request.id}</p>
          <p><strong>סטטוס:</strong> ${request.status}</p>
          ${admin ? `<p><strong>מתנדב:</strong> ${admin.username}</p>` : ''}
        </div>
        <p>בברכה,<br>צוות Help Savta</p>
      </div>
    `;

    return this.sendBasicEmail(request.email, subject, htmlContent);
  }

  private async sendBasicCompletedEmail(request: any, admin?: any, slot?: any): Promise<boolean> {
    const subject = `בקשה #${request.id} הושלמה - Help Savta`;
    const htmlContent = `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">שלום ${request.full_name},</h2>
        <p>אנו שמחים לעדכן אותך שהבקשה שלך הושלמה בהצלחה!</p>
        <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>✅ בקשה הושלמה</h3>
          <p><strong>מספר בקשה:</strong> #${request.id}</p>
          ${admin ? `<p><strong>המתנדב שטיפל:</strong> ${admin.username}</p>` : ''}
        </div>
        <p>תודה שבחרת בשירות Help Savta!</p>
        <p>בברכה,<br>צוות Help Savta</p>
      </div>
    `;

    return this.sendBasicEmail(request.email, subject, htmlContent);
  }

  private async sendBasicEmail(to: string, subject: string, html: string): Promise<boolean> {
    if (!this.config) return false;

    try {
      const msg = {
        to,
        from: {
          email: this.config.fromEmail,
          name: this.config.fromName
        },
        replyTo: this.config.replyToEmail,
        subject,
        html,
        trackingSettings: {
          clickTracking: {
            enable: false
          },
          openTracking: {
            enable: false
          }
        }
      };

      await sgMail.send(msg);
      return true;
    } catch (error) {
      console.error('❌ Error sending basic email:', error);
      return false;
    }
  }

  /**
   * Helper methods
   */
  private isRetryableError(error: any): boolean {
    // Retry on temporary failures, not on authentication or validation errors
    const retryableCodes = [500, 502, 503, 504, 429]; // Server errors and rate limiting
    return retryableCodes.includes(error.code);
  }

  private async addToQueue(templateType: string, recipientEmail: string, data: any): Promise<void> {
    const queueId = `${templateType}-${recipientEmail}-${Date.now()}`;
    const queueItem: EmailQueue = {
      id: queueId,
      recipientEmail,
      templateType,
      data,
      retryCount: 0,
      maxRetries: 3,
      scheduledAt: new Date(Date.now() + (this.retryDelays[0] || 1000))
    };

    this.emailQueue.set(queueId, queueItem);
    console.log(`📧 Added email to retry queue: ${queueId}`);
  }

  private async logNotification(
    type: string,
    recipient: string,
    message: string,
    status: 'pending' | 'sent' | 'failed' | 'not_sent'
  ): Promise<void> {
    try {
      await prisma.notificationLog.create({
        data: {
          type,
          recipient,
          message,
          status
        }
      });
    } catch (error) {
      console.error('❌ Failed to log notification:', error);
    }
  }

  /**
   * Public methods
   */
  isReady(): boolean {
    return this.isConfigured && this.config !== null;
  }

  getConfig(): SendGridConfig | null {
    return this.config;
  }

  getQueueStatus(): { queued: number; processing: boolean } {
    return {
      queued: this.emailQueue.size,
      processing: false // Could be enhanced with actual processing status
    };
  }

  /**
   * Start queue processor (call this from server startup)
   */
  startQueueProcessor(): void {
    // Process queue every 30 seconds
    setInterval(() => {
      this.processEmailQueue().catch(error => {
        console.error('❌ Error processing email queue:', error);
      });
    }, 30000);

    console.log('📧 SendGrid email queue processor started');
  }
}

// Export singleton instance
export const sendGridService = new SendGridEmailService();