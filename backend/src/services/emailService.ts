import nodemailer from 'nodemailer';
import { prisma } from '../server';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private isConfigured = false;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter(): void {
    try {
      // Check if email environment variables are configured
      const emailHost = process.env.EMAIL_HOST;
      const emailPort = process.env.EMAIL_PORT;
      const emailUser = process.env.EMAIL_USER;
      const emailPass = process.env.EMAIL_PASS;

      if (!emailHost || !emailPort || !emailUser || !emailPass) {
        console.log('📧 Email service not configured - missing environment variables');
        return;
      }

      const config: EmailConfig = {
        host: emailHost,
        port: parseInt(emailPort),
        secure: parseInt(emailPort) === 465, // true for 465, false for other ports
        auth: {
          user: emailUser,
          pass: emailPass
        }
      };

      this.transporter = nodemailer.createTransport(config);
      this.isConfigured = true;
      console.log('📧 Email service configured successfully');
    } catch (error) {
      console.error('❌ Failed to configure email service:', error);
    }
  }

  /**
   * Send approval email to user when request status changes to "scheduled"
   * שליחת אימייל אישור למשתמש כאשר סטטוס הבקשה משתנה ל"מתוכנן"
   */
  async sendApprovalEmail(
    recipientEmail: string,
    recipientName: string,
    scheduledDate: string,
    scheduledTime: string,
    requestId: number
  ): Promise<boolean> {
    if (!this.isConfigured || !this.transporter) {
      console.log('📧 Email service not configured - logging notification instead');
      await this.logNotification('email', recipientEmail, 
        `Request #${requestId} scheduled for ${scheduledDate} at ${scheduledTime}`, 'not_sent');
      return false;
    }

    try {
      const subject = 'אישור תיאום ביקור טכני - Help Savta';
      const htmlContent = `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">שלום ${recipientName},</h2>
          
          <p style="font-size: 16px; line-height: 1.6;">
            אנו שמחים לעדכן אותך שבקשתך לעזרה טכנית אושרה ותואמה!
          </p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1f2937; margin-top: 0;">פרטי הביקור:</h3>
            <p><strong>תאריך:</strong> ${scheduledDate}</p>
            <p><strong>שעה:</strong> ${scheduledTime}</p>
            <p><strong>מספר בקשה:</strong> #${requestId}</p>
          </div>
          
          <p style="font-size: 14px; color: #6b7280;">
            המתנדב שלנו יגיע אליך בזמן הקבוע. במידה ויש צורך לשנות את המועד, 
            אנא צרו קשר איתנו מראש.
          </p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="font-size: 12px; color: #9ca3af; text-align: center;">
              בברכה,<br>
              צוות Help Savta
            </p>
          </div>
        </div>
      `;

      const textContent = `
שלום ${recipientName},

אנו שמחים לעדכן אותך שבקשתך לעזרה טכנית אושרה ותואמה!

פרטי הביקור:
תאריך: ${scheduledDate}
שעה: ${scheduledTime}
מספר בקשה: #${requestId}

המתנדב שלנו יגיע אליך בזמן הקבוע. במידה ויש צורך לשנות את המועד, אנא צרו קשר איתנו מראש.

בברכה,
צוות Help Savta
      `;

      const mailOptions = {
        from: `"Help Savta" <${process.env.EMAIL_USER}>`,
        to: recipientEmail,
        subject,
        text: textContent,
        html: htmlContent
      };

      await this.transporter.sendMail(mailOptions);
      
      // Log successful notification
      await this.logNotification('email', recipientEmail, 
        `Approval email sent for request #${requestId}`, 'sent');
      
      console.log(`📧 Approval email sent successfully to ${recipientEmail}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to send approval email:', error);
      
      // Log failed notification
      await this.logNotification('email', recipientEmail, 
        `Failed to send approval email for request #${requestId}`, 'failed');
      
      return false;
    }
  }

  /**
   * Send status update email to user when request status changes from "pending" to "in_progress"
   * שליחת אימייל עדכון סטטוס למשתמש כאשר סטטוס הבקשה משתנה מ"ממתין" ל"בטיפול"
   */
  async sendStatusUpdateEmail(
    recipientEmail: string,
    recipientName: string,
    requestId: string,
    newStatus: string
  ): Promise<boolean> {
    if (!this.isConfigured || !this.transporter) {
      console.log('📧 Email service not configured - logging notification instead');
      await this.logNotification('email', recipientEmail,
        `Request #${requestId} status updated to ${newStatus}`, 'not_sent');
      return false;
    }

    try {
      const subject = 'עדכון סטטוס בקשה - Help Savta';
      const htmlContent = `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">שלום ${recipientName},</h2>
          
          <p style="font-size: 16px; line-height: 1.6;">
            אנו שמחים לעדכן אותך שבקשתך לעזרה טכנית החלה להיות מטופלת!
          </p>
          
          <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-right: 4px solid #22c55e;">
            <h3 style="color: #15803d; margin-top: 0;">✅ הבקשה בטיפול</h3>
            <p><strong>מספר בקשה:</strong> #${requestId}</p>
            <p><strong>סטטוס חדש:</strong> בטיפול</p>
          </div>
          
          <p style="font-size: 14px; color: #6b7280;">
            המתנדב שלנו התחיל לטפל בבקשתך. אנו נעדכן אותך בכל שלב נוסף בתהליך.
            במידה ויש לך שאלות נוספות, אנא צרו קשר איתנו.
          </p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="font-size: 12px; color: #9ca3af; text-align: center;">
              בברכה,<br>
              צוות Help Savta
            </p>
          </div>
        </div>
      `;

      const textContent = `
שלום ${recipientName},

אנו שמחים לעדכן אותך שבקשתך לעזרה טכנית החלה להיות מטופלת!

פרטי העדכון:
מספר בקשה: #${requestId}
סטטוס חדש: בטיפול

המתנדב שלנו התחיל לטפל בבקשתך. אנו נעדכן אותך בכל שלב נוסף בתהליך.
במידה ויש לך שאלות נוספות, אנא צרו קשר איתנו.

בברכה,
צוות Help Savta
      `;

      const mailOptions = {
        from: `"Help Savta" <${process.env.EMAIL_USER}>`,
        to: recipientEmail,
        subject,
        text: textContent,
        html: htmlContent
      };

      await this.transporter.sendMail(mailOptions);
      
      // Log successful notification
      await this.logNotification('email', recipientEmail,
        `Status update email sent for request #${requestId} (${newStatus})`, 'sent');
      
      console.log(`📧 Status update email sent successfully to ${recipientEmail}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to send status update email:', error);
      
      // Log failed notification
      await this.logNotification('email', recipientEmail,
        `Failed to send status update email for request #${requestId}`, 'failed');
      
      return false;
    }
  }

  /**
   * Log notification in the database
   * רישום התראה במסד הנתונים
   */
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
   * Check if email service is properly configured
   * בדיקה אם שירות האימייל מוגדר כראוי
   */
  isReady(): boolean {
    return this.isConfigured && this.transporter !== null;
  }

  /**
   * Test email configuration
   * בדיקת הגדרות האימייל
   */
  async testConnection(): Promise<boolean> {
    if (!this.transporter) {
      return false;
    }

    try {
      await this.transporter.verify();
      console.log('📧 Email service connection test successful');
      return true;
    } catch (error) {
      console.error('❌ Email service connection test failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const emailService = new EmailService();