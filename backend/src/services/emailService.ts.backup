import nodemailer from 'nodemailer';
import { prisma } from '../server';
import { renderEmailTemplate } from '../config/emailTemplateConfig';
import { templateService } from './templateService';

// Dynamic import for SendGrid to avoid breaking if not available
let sendGridService: any = null;
try {
  // Only import if @sendgrid/mail is available
  sendGridService = require('./sendGridService').sendGridService;
} catch (error) {
  console.log('📧 SendGrid service not available, using SMTP fallback only');
}

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
   * Send request created email using template
   * שליחת אימייל יצירת בקשה באמצעות תבנית
   */
  async sendRequestCreatedEmail(request: any): Promise<boolean> {
    // Try SendGrid first if available
    if (sendGridService && sendGridService.isReady && sendGridService.isReady()) {
      console.log('📧 Using SendGrid for request created email');
      try {
        return await sendGridService.sendRequestCreatedEmail(request);
      } catch (error) {
        console.error('❌ SendGrid failed, falling back to SMTP:', error);
      }
    }

    // Fallback to SMTP
    console.log('📧 Using SMTP for request created email');
    return await this.sendRequestCreatedEmailSMTP(request);
  }

  /**
   * SMTP fallback for request created email
   */
  private async sendRequestCreatedEmailSMTP(request: any): Promise<boolean> {
    if (!this.isConfigured || !this.transporter) {
      console.log('📧 Email service not configured - logging notification instead');
      await this.logNotification('email', request.email,
        `Request created email for #${request.id}`, 'not_sent');
      return false;
    }

    try {
      // Check if template service is ready
      if (!templateService.isReady()) {
        console.warn('⚠️ Template service not ready - falling back to basic email');
        return await this.sendBasicRequestCreatedEmail(request);
      }

      const emailContent = await renderEmailTemplate('request-created', request);
      if (!emailContent) {
        console.warn('⚠️ Failed to render template - falling back to basic email');
        return await this.sendBasicRequestCreatedEmail(request);
      }

      const mailOptions = {
        from: `"Help Savta" <${process.env.EMAIL_USER}>`,
        to: request.email,
        subject: emailContent.subject,
        text: emailContent.text,
        html: emailContent.html
      };

      await this.transporter.sendMail(mailOptions);
      
      // Log successful notification
      await this.logNotification('email', request.email,
        `Request created email sent for #${request.id} (SMTP)`, 'sent');
      
      console.log(`📧 SMTP: Request created email sent successfully to ${request.email}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to send request created email via SMTP:', error);
      
      // Log failed notification
      await this.logNotification('email', request.email,
        `Failed to send request created email for #${request.id} (SMTP)`, 'failed');
      
      return false;
    }
  }

  /**
   * Send status update email using template
   * שליחת אימייל עדכון סטטוס באמצעות תבנית
   */
  async sendStatusUpdateEmailTemplate(request: any, admin?: any): Promise<boolean> {
    // Try SendGrid first if available
    if (sendGridService && sendGridService.isReady && sendGridService.isReady()) {
      console.log('📧 Using SendGrid for status update email');
      try {
        return await sendGridService.sendStatusUpdateEmail(request, admin);
      } catch (error) {
        console.error('❌ SendGrid failed, falling back to SMTP:', error);
      }
    }

    // Fallback to SMTP
    console.log('📧 Using SMTP for status update email');
    return await this.sendStatusUpdateEmailSMTP(request, admin);
  }

  /**
   * SMTP fallback for status update email
   */
  private async sendStatusUpdateEmailSMTP(request: any, admin?: any): Promise<boolean> {
    if (!this.isConfigured || !this.transporter) {
      console.log('📧 Email service not configured - logging notification instead');
      await this.logNotification('email', request.email,
        `Status update email for #${request.id}`, 'not_sent');
      return false;
    }

    try {
      // Check if template service is ready
      if (!templateService.isReady()) {
        console.warn('⚠️ Template service not ready - falling back to basic email');
        return await this.sendStatusUpdateEmail(request.email, request.full_name, request.id.toString(), request.status);
      }

      const emailContent = await renderEmailTemplate('status-update', request, admin);
      if (!emailContent) {
        console.warn('⚠️ Failed to render template - falling back to basic email');
        return await this.sendStatusUpdateEmail(request.email, request.full_name, request.id.toString(), request.status);
      }

      const mailOptions = {
        from: `"Help Savta" <${process.env.EMAIL_USER}>`,
        to: request.email,
        subject: emailContent.subject,
        text: emailContent.text,
        html: emailContent.html
      };

      await this.transporter.sendMail(mailOptions);
      
      // Log successful notification
      await this.logNotification('email', request.email,
        `Status update email sent for #${request.id} (SMTP)`, 'sent');
      
      console.log(`📧 SMTP: Status update email sent successfully to ${request.email}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to send status update email via SMTP:', error);
      
      // Log failed notification
      await this.logNotification('email', request.email,
        `Failed to send status update email for #${request.id} (SMTP)`, 'failed');
      
      return false;
    }
  }

  /**
   * Send request completed email using template
   * שליחת אימייל השלמת בקשה באמצעות תבנית
   */
  async sendRequestCompletedEmail(request: any, admin?: any, slot?: any): Promise<boolean> {
    // Try SendGrid first if available
    if (sendGridService && sendGridService.isReady && sendGridService.isReady()) {
      console.log('📧 Using SendGrid for request completed email');
      try {
        return await sendGridService.sendRequestCompletedEmail(request, admin, slot);
      } catch (error) {
        console.error('❌ SendGrid failed, falling back to SMTP:', error);
      }
    }

    // Fallback to SMTP
    console.log('📧 Using SMTP for request completed email');
    return await this.sendRequestCompletedEmailSMTP(request, admin, slot);
  }

  /**
   * SMTP fallback for request completed email
   */
  private async sendRequestCompletedEmailSMTP(request: any, admin?: any, slot?: any): Promise<boolean> {
    if (!this.isConfigured || !this.transporter) {
      console.log('📧 Email service not configured - logging notification instead');
      await this.logNotification('email', request.email,
        `Request completed email for #${request.id}`, 'not_sent');
      return false;
    }

    try {
      // Check if template service is ready
      if (!templateService.isReady()) {
        console.warn('⚠️ Template service not ready - falling back to basic email');
        return await this.sendBasicCompletedEmail(request, admin, slot);
      }

      const emailContent = await renderEmailTemplate('request-completed', request, admin, slot);
      if (!emailContent) {
        console.warn('⚠️ Failed to render template - falling back to basic email');
        return await this.sendBasicCompletedEmail(request, admin, slot);
      }

      const mailOptions = {
        from: `"Help Savta" <${process.env.EMAIL_USER}>`,
        to: request.email,
        subject: emailContent.subject,
        text: emailContent.text,
        html: emailContent.html
      };

      await this.transporter.sendMail(mailOptions);
      
      // Log successful notification
      await this.logNotification('email', request.email,
        `Request completed email sent for #${request.id} (SMTP)`, 'sent');
      
      console.log(`📧 SMTP: Request completed email sent successfully to ${request.email}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to send request completed email via SMTP:', error);
      
      // Log failed notification
      await this.logNotification('email', request.email,
        `Failed to send request completed email for #${request.id} (SMTP)`, 'failed');
      
      return false;
    }
  }

  /**
   * Send email verification
   */
  async sendEmailVerification(email: string, verificationToken: string, baseUrl: string): Promise<boolean> {
    // Try SendGrid first if available
    if (sendGridService && sendGridService.isReady && sendGridService.isReady()) {
      console.log('📧 Using SendGrid for email verification');
      try {
        return await sendGridService.sendEmailVerification(email, verificationToken, baseUrl);
      } catch (error) {
        console.error('❌ SendGrid failed, falling back to SMTP:', error);
      }
    }

    // Fallback to SMTP
    console.log('📧 Using SMTP for email verification');
    return await this.sendEmailVerificationSMTP(email, verificationToken, baseUrl);
  }

  /**
   * SMTP fallback for email verification
   */
  private async sendEmailVerificationSMTP(email: string, verificationToken: string, baseUrl: string): Promise<boolean> {
    if (!this.isConfigured || !this.transporter) {
      console.log('📧 Email service not configured - cannot send verification email');
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

      const mailOptions = {
        from: `"Help Savta" <${process.env.EMAIL_USER}>`,
        to: email,
        subject,
        text: textContent,
        html: htmlContent
      };

      await this.transporter.sendMail(mailOptions);
      
      await this.logNotification('email', email,
        'Email verification sent (SMTP)', 'sent');
      
      console.log(`📧 SMTP: Email verification sent to ${email}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to send verification email via SMTP:', error);
      
      await this.logNotification('email', email,
        `Failed to send email verification (SMTP): ${error.message}`, 'failed');
      
      return false;
    }
  }

  /**
   * Fallback method for request created email
   * שיטת חלופה לאימייל יצירת בקשה
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

    const textContent = `
שלום ${request.full_name},

תודה על פנייתך לשירות Help Savta!

פרטי הבקשה:
מספר בקשה: #${request.id}
תיאור הבעיה: ${request.problem_description}

נחזור אליך בהקדם האפשרי.

בברכה,
צוות Help Savta
    `;

    const mailOptions = {
      from: `"Help Savta" <${process.env.EMAIL_USER}>`,
      to: request.email,
      subject,
      text: textContent,
      html: htmlContent
    };

    if (this.transporter) {
      await this.transporter.sendMail(mailOptions);
    }
    return true;
  }

  /**
   * Fallback method for completed email
   * שיטת חלופה לאימייל השלמה
   */
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

    const textContent = `
שלום ${request.full_name},

אנו שמחים לעדכן אותך שהבקשה שלך הושלמה בהצלחה!

מספר בקשה: #${request.id}
${admin ? `המתנדב שטיפל: ${admin.username}` : ''}

תודה שבחרת בשירות Help Savta!

בברכה,
צוות Help Savta
    `;

    const mailOptions = {
      from: `"Help Savta" <${process.env.EMAIL_USER}>`,
      to: request.email,
      subject,
      text: textContent,
      html: htmlContent
    };

    if (this.transporter) {
      await this.transporter.sendMail(mailOptions);
    }
    return true;
  }

  /**
   * Send approval email to user when request status changes to "scheduled" (LEGACY)
   * שליחת אימייל אישור למשתמש כאשר סטטוס הבקשה משתנה ל"מתוכנן" (מורשת)
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
   * Send status update email to user when request status changes from "pending" to "in_progress" (LEGACY)
   * שליחת אימייל עדכון סטטוס למשתמש כאשר סטטוס הבקשה משתנה מ"ממתין" ל"בטיפול" (מורשת)
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
   * Test email templates with mock data
   * בדיקת תבניות אימייל עם נתונים מדומים
   */
  async testEmailTemplates(): Promise<{ success: boolean; results: any[] }> {
    console.log('🧪 Testing email templates...');
    
    const results: any[] = [];
    
    // Mock request data
    const mockRequest = {
      id: 123,
      full_name: 'יוסי כהן',
      phone: '050-1234567',
      email: 'yossi@example.com',
      address: 'רחוב הרצל 10, תל אביב',
      problem_description: 'המחשב לא מתחיל, אין צליל ואין תמונה על המסך. ניסיתי להפעיל מספר פעמים אבל זה לא עוזר.',
      urgency_level: 'high',
      status: 'in_progress',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      notes: 'הלקוח ביקש טיפול מהיר בגלל עבודה חשובה'
    };

    const mockAdmin = {
      id: 1,
      username: 'מתנדב ראשי'
    };

    const mockSlot = {
      id: 1,
      date: '2024-01-15',
      start_time: '14:00',
      end_time: '16:00'
    };

    try {
      // Test request-created template
      console.log('🧪 Testing request-created template...');
      const createdContent = await renderEmailTemplate('request-created', mockRequest);
      results.push({
        template: 'request-created',
        success: !!createdContent,
        hasHtml: createdContent ? createdContent.html.length > 0 : false,
        hasText: createdContent ? createdContent.text.length > 0 : false,
        subject: createdContent?.subject || 'N/A'
      });

      // Test status-update template
      console.log('🧪 Testing status-update template...');
      const statusContent = await renderEmailTemplate('status-update', mockRequest, mockAdmin);
      results.push({
        template: 'status-update',
        success: !!statusContent,
        hasHtml: statusContent ? statusContent.html.length > 0 : false,
        hasText: statusContent ? statusContent.text.length > 0 : false,
        subject: statusContent?.subject || 'N/A'
      });

      // Test request-completed template
      console.log('🧪 Testing request-completed template...');
      const completedContent = await renderEmailTemplate('request-completed', mockRequest, mockAdmin, mockSlot);
      results.push({
        template: 'request-completed',
        success: !!completedContent,
        hasHtml: completedContent ? completedContent.html.length > 0 : false,
        hasText: completedContent ? completedContent.text.length > 0 : false,
        subject: completedContent?.subject || 'N/A'
      });

      const allSuccessful = results.every(r => r.success);
      
      console.log('📊 Template test results:', results);
      console.log(allSuccessful ? '✅ All templates tested successfully!' : '❌ Some templates failed');

      return { success: allSuccessful, results };

    } catch (error) {
      console.error('❌ Template testing failed:', error);
      return { success: false, results };
    }
  }

  /**
   * Send test email using templates
   * שליחת אימייל בדיקה באמצעות תבניות
   */
  async sendTestEmail(templateType: 'request-created' | 'status-update' | 'request-completed', recipientEmail: string): Promise<boolean> {
    if (!this.isConfigured || !this.transporter) {
      console.log('📧 Email service not configured - cannot send test email');
      return false;
    }

    // Mock request data for testing
    const mockRequest = {
      id: 999,
      full_name: 'משתמש בדיקה',
      phone: '050-9999999',
      email: recipientEmail,
      address: 'כתובת בדיקה 123, עיר הבדיקה',
      problem_description: 'זהו אימייל בדיקה למערכת Help Savta. הבעיה המדומה: מחשב לא עובד כראוי.',
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

    try {
      let emailContent;
      
      switch (templateType) {
        case 'request-created':
          emailContent = await renderEmailTemplate('request-created', mockRequest);
          break;
        case 'status-update':
          emailContent = await renderEmailTemplate('status-update', mockRequest, mockAdmin);
          break;
        case 'request-completed':
          emailContent = await renderEmailTemplate('request-completed', mockRequest, mockAdmin, mockSlot);
          break;
      }

      if (!emailContent) {
        console.error('❌ Failed to render test email template');
        return false;
      }

      const mailOptions = {
        from: `"Help Savta (בדיקה)" <${process.env.EMAIL_USER}>`,
        to: recipientEmail,
        subject: `[בדיקה] ${emailContent.subject}`,
        text: `זהו אימייל בדיקה!\n\n${emailContent.text}`,
        html: emailContent.html.replace(
          '<h1>Help Savta</h1>',
          '<h1>Help Savta (בדיקה)</h1>'
        )
      };

      if (this.transporter) {
        await this.transporter.sendMail(mailOptions);
      }
      
      console.log(`📧 Test email sent successfully to ${recipientEmail}`);
      return true;

    } catch (error) {
      console.error('❌ Failed to send test email:', error);
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