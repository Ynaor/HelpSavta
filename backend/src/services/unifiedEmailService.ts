import nodemailer from 'nodemailer';
import sgMail from '@sendgrid/mail';
import { prisma } from '../server';
import { renderEmailTemplate } from '../config/emailTemplateConfig';

interface EmailProvider {
  name: string;
  send(emailData: EmailData): Promise<boolean>;
  testConnection(): Promise<boolean>;
  isReady(): boolean;
}

interface EmailData {
  to: string;
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
  metadata?: Record<string, any>;
}

interface SMTPConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

interface SendGridConfig {
  apiKey: string;
  fromEmail: string;
  fromName: string;
  replyToEmail?: string;
}

class SMTPProvider implements EmailProvider {
  name = 'SMTP';
  private transporter: nodemailer.Transporter | null = null;
  private config: SMTPConfig | null = null;

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    try {
      const emailHost = process.env.EMAIL_HOST;
      const emailPort = process.env.EMAIL_PORT;
      const emailUser = process.env.EMAIL_USER;
      const emailPass = process.env.EMAIL_PASS;

      if (!emailHost || !emailPort || !emailUser || !emailPass) {
        console.log('📧 SMTP not configured - missing environment variables');
        return;
      }

      this.config = {
        host: emailHost,
        port: parseInt(emailPort),
        secure: parseInt(emailPort) === 465,
        auth: {
          user: emailUser,
          pass: emailPass
        }
      };

      this.transporter = nodemailer.createTransport(this.config);
      console.log('📧 SMTP provider configured successfully');
    } catch (error) {
      console.error('❌ Failed to configure SMTP provider:', error);
    }
  }

  async send(emailData: EmailData): Promise<boolean> {
    if (!this.transporter) return false;

    try {
      const mailOptions = {
        from: `"Help Savta" <${process.env.EMAIL_USER}>`,
        to: emailData.to,
        subject: emailData.subject,
        text: emailData.text,
        html: emailData.html,
        replyTo: emailData.replyTo
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`📧 SMTP: Email sent successfully to ${emailData.to}`);
      return true;
    } catch (error) {
      console.error('❌ SMTP send failed:', error);
      return false;
    }
  }

  async testConnection(): Promise<boolean> {
    if (!this.transporter) return false;

    try {
      await this.transporter.verify();
      console.log('📧 SMTP connection test successful');
      return true;
    } catch (error) {
      console.error('❌ SMTP connection test failed:', error);
      return false;
    }
  }

  isReady(): boolean {
    return this.transporter !== null;
  }
}

class SendGridProvider implements EmailProvider {
  name = 'SendGrid';
  private config: SendGridConfig | null = null;

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    try {
      const apiKey = process.env.SENDGRID_API_KEY;
      const fromEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@helpsavta.com';
      const fromName = process.env.EMAIL_FROM_NAME || 'Help Savta';
      const replyToEmail = process.env.EMAIL_REPLY_TO || process.env.SUPPORT_EMAIL;

      if (!apiKey) {
        console.log('📧 SendGrid not configured - missing SENDGRID_API_KEY');
        return;
      }

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

      console.log('📧 SendGrid provider configured successfully');
    } catch (error) {
      console.error('❌ Failed to configure SendGrid provider:', error);
    }
  }

  async send(emailData: EmailData): Promise<boolean> {
    if (!this.config) return false;

    try {
      const msg = {
        to: emailData.to,
        from: {
          email: this.config.fromEmail,
          name: this.config.fromName
        },
        replyTo: emailData.replyTo || this.config.replyToEmail,
        subject: emailData.subject,
        text: emailData.text,
        html: emailData.html,
        trackingSettings: {
          clickTracking: { enable: false },
          openTracking: { enable: false }
        },
        customArgs: emailData.metadata || {}
      };

      await sgMail.send(msg);
      console.log(`📧 SendGrid: Email sent successfully to ${emailData.to}`);
      return true;
    } catch (error) {
      console.error('❌ SendGrid send failed:', error);
      return false;
    }
  }

  async testConnection(): Promise<boolean> {
    if (!this.config) return false;

    try {
      const testMsg = {
        to: 'test@invalid-domain-for-testing.invalid',
        from: this.config.fromEmail,
        subject: 'Connection Test',
        text: 'This is a connection test'
      };

      try {
        await sgMail.send(testMsg);
        return true;
      } catch (error: any) {
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

  isReady(): boolean {
    return this.config !== null;
  }
}

class UnifiedEmailService {
  private providers: EmailProvider[] = [];
  private primaryProvider: EmailProvider | null = null;

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders(): void {
    const sendGridProvider = new SendGridProvider();
    const smtpProvider = new SMTPProvider();

    // Add providers in priority order (SendGrid first, SMTP as fallback)
    if (sendGridProvider.isReady()) {
      this.providers.push(sendGridProvider);
      this.primaryProvider = sendGridProvider;
    }

    if (smtpProvider.isReady()) {
      this.providers.push(smtpProvider);
      if (!this.primaryProvider) {
        this.primaryProvider = smtpProvider;
      }
    }

    console.log(`📧 Unified email service initialized with ${this.providers.length} provider(s)`);
    if (this.primaryProvider) {
      console.log(`📧 Primary provider: ${this.primaryProvider.name}`);
    }
  }

  private async sendWithFallback(emailData: EmailData): Promise<boolean> {
    for (const provider of this.providers) {
      console.log(`📧 Attempting to send email via ${provider.name}`);
      const success = await provider.send(emailData);
      
      if (success) {
        await this.logNotification('email', emailData.to, 
          `Email sent via ${provider.name}`, 'sent');
        return true;
      }
      
      console.log(`📧 ${provider.name} failed, trying next provider...`);
    }

    await this.logNotification('email', emailData.to, 
      'All email providers failed', 'failed');
    return false;
  }

  async sendRequestCreatedEmail(request: any): Promise<boolean> {
    if (!this.isReady()) {
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

      const emailData: EmailData = {
        to: request.email,
        subject: emailContent.subject,
        text: emailContent.text,
        html: emailContent.html,
        metadata: {
          requestId: request.id.toString(),
          templateType: 'request-created'
        }
      };

      return await this.sendWithFallback(emailData);
    } catch (error) {
      console.error('❌ Failed to send request created email:', error);
      return false;
    }
  }

  async sendStatusUpdateEmail(request: any, admin?: any): Promise<boolean> {
    if (!this.isReady()) {
      await this.logNotification('email', request.email,
        `Status update email for #${request.id}`, 'not_sent');
      return false;
    }

    try {
      const emailContent = await renderEmailTemplate('status-update', request, admin);
      if (!emailContent) {
        console.warn('⚠️ Failed to render template - using legacy method');
        return await this.sendLegacyStatusUpdateEmail(request.email, request.full_name, request.id.toString(), request.status);
      }

      const emailData: EmailData = {
        to: request.email,
        subject: emailContent.subject,
        text: emailContent.text,
        html: emailContent.html,
        metadata: {
          requestId: request.id.toString(),
          templateType: 'status-update'
        }
      };

      return await this.sendWithFallback(emailData);
    } catch (error) {
      console.error('❌ Failed to send status update email:', error);
      return false;
    }
  }

  async sendRequestCompletedEmail(request: any, admin?: any, slot?: any): Promise<boolean> {
    if (!this.isReady()) {
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

      const emailData: EmailData = {
        to: request.email,
        subject: emailContent.subject,
        text: emailContent.text,
        html: emailContent.html,
        metadata: {
          requestId: request.id.toString(),
          templateType: 'request-completed'
        }
      };

      return await this.sendWithFallback(emailData);
    } catch (error) {
      console.error('❌ Failed to send request completed email:', error);
      return false;
    }
  }

  async sendEmailVerification(email: string, verificationToken: string, baseUrl: string): Promise<boolean> {
    if (!this.isReady()) {
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

      const emailData: EmailData = {
        to: email,
        subject,
        text: textContent,
        html: htmlContent,
        metadata: {
          templateType: 'email-verification'
        }
      };

      return await this.sendWithFallback(emailData);
    } catch (error) {
      console.error('❌ Failed to send verification email:', error);
      return false;
    }
  }

  async sendTestEmail(templateType: 'request-created' | 'status-update' | 'request-completed' | 'basic', recipientEmail: string): Promise<boolean> {
    if (!this.isReady()) {
      console.log('📧 Email service not configured - cannot send test email');
      return false;
    }

    try {
      if (templateType === 'basic') {
        const emailData: EmailData = {
          to: recipientEmail,
          subject: '[בדיקה] Unified Email Service - Help Savta',
          text: 'זהו אימייל בדיקה מהשירות המאוחד של Help Savta!',
          html: `
            <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2563eb;">✅ שירות האימייל המאוחד פועל!</h2>
              <p>זהו אימייל בדיקה מהשירות המאוחד עם תמיכה ב-SendGrid ו-SMTP.</p>
              <p>תאריך בדיקה: ${new Date().toLocaleString('he-IL')}</p>
              <p>בברכה,<br>צוות Help Savta</p>
            </div>
          `,
          metadata: {
            templateType: 'test-basic'
          }
        };

        return await this.sendWithFallback(emailData);
      } else {
        // Use template-based test email
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

        switch (templateType) {
          case 'request-created':
            return await this.sendRequestCreatedEmail(mockRequest);
          case 'status-update':
            return await this.sendStatusUpdateEmail(mockRequest, { id: 999, username: 'מתנדב בדיקה' });
          case 'request-completed':
            return await this.sendRequestCompletedEmail(mockRequest, { id: 999, username: 'מתנדב בדיקה' }, 
              { id: 999, date: new Date().toISOString().split('T')[0], start_time: '10:00', end_time: '12:00' });
        }
      }
    } catch (error) {
      console.error('❌ Failed to send test email:', error);
      return false;
    }
  }

  // Basic email fallback methods
  private async sendBasicRequestCreatedEmail(request: any): Promise<boolean> {
    const emailData: EmailData = {
      to: request.email,
      subject: `בקשה #${request.id} התקבלה - Help Savta`,
      text: `שלום ${request.full_name},\n\nתודה על פנייתך לשירות Help Savta!\n\nמספר בקשה: #${request.id}\nתיאור הבעיה: ${request.problem_description}\n\nנחזור אליך בהקדם האפשרי.\n\nבברכה,\nצוות Help Savta`,
      html: `
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
      `
    };

    return await this.sendWithFallback(emailData);
  }

  private async sendBasicCompletedEmail(request: any, admin?: any, slot?: any): Promise<boolean> {
    const emailData: EmailData = {
      to: request.email,
      subject: `בקשה #${request.id} הושלמה - Help Savta`,
      text: `שלום ${request.full_name},\n\nאנו שמחים לעדכן אותך שהבקשה שלך הושלמה בהצלחה!\n\nמספר בקשה: #${request.id}\n${admin ? `המתנדב שטיפל: ${admin.username}` : ''}\n\nתודה שבחרת בשירות Help Savta!\n\nבברכה,\nצוות Help Savta`,
      html: `
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
      `
    };

    return await this.sendWithFallback(emailData);
  }

  // Legacy method compatibility
  private async sendLegacyStatusUpdateEmail(recipientEmail: string, recipientName: string, requestId: string, newStatus: string): Promise<boolean> {
    const emailData: EmailData = {
      to: recipientEmail,
      subject: 'עדכון סטטוס בקשה - Help Savta',
      text: `שלום ${recipientName},\n\nאנו שמחים לעדכן אותך שבקשתך לעזרה טכנית החלה להיות מטופלת!\n\nמספר בקשה: #${requestId}\nסטטוס חדש: ${newStatus}\n\nבברכה,\nצוות Help Savta`,
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">שלום ${recipientName},</h2>
          <p>אנו שמחים לעדכן אותך שבקשתך לעזרה טכנית החלה להיות מטופלת!</p>
          <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-right: 4px solid #22c55e;">
            <h3 style="color: #15803d; margin-top: 0;">✅ הבקשה בטיפול</h3>
            <p><strong>מספר בקשה:</strong> #${requestId}</p>
            <p><strong>סטטוס חדש:</strong> ${newStatus}</p>
          </div>
          <p>בברכה,<br>צוות Help Savta</p>
        </div>
      `
    };

    return await this.sendWithFallback(emailData);
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

  isReady(): boolean {
    return this.providers.length > 0;
  }

  async testConnection(): Promise<boolean> {
    if (!this.primaryProvider) return false;
    return await this.primaryProvider.testConnection();
  }

  getProviders(): string[] {
    return this.providers.map(p => p.name);
  }
}

// Export singleton instance
export const unifiedEmailService = new UnifiedEmailService();

// Legacy exports for backward compatibility
export { unifiedEmailService as emailService };
export { unifiedEmailService as sendGridService };