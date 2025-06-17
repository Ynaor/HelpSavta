import express from 'express';
import { emailService } from '../services/emailService';
import { templateService } from '../services/templateService';
import { renderEmailTemplate } from '../config/emailTemplateConfig';

const router = express.Router();

/**
 * Test email templates endpoint
 * נקודת קצה לבדיקת תבניות אימייל
 */
router.get('/email-templates', async (req, res) => {
  try {
    console.log('🧪 Starting email template test...');

    // Test template service readiness
    const templateServiceReady = templateService.isReady();
    const emailServiceReady = emailService.isReady();

    // Test email service connection
    const connectionTest = emailServiceReady ? await emailService.testConnection() : false;

    res.json({
      success: true,
      templateServiceReady,
      emailServiceReady,
      connectionTest,
      availableTemplates: templateService.getAvailableTemplates(),
      providers: emailService.getProviders(),
      message: 'Email template test completed'
    });

  } catch (error) {
    console.error('❌ Email template test failed:', error);
    res.status(500).json({
      success: false,
      error: 'Email template test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Send test email endpoint
 * נקודת קצה לשליחת אימייל בדיקה
 */
router.post('/send-test-email', async (req, res) => {
  try {
    const { templateType, email } = req.body;

    if (!templateType || !email) {
      return res.status(400).json({
        success: false,
        error: 'templateType and email are required'
      });
    }

    if (!['request-created', 'status-update', 'request-completed'].includes(templateType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid templateType. Must be: request-created, status-update, or request-completed'
      });
    }

    const result = await emailService.sendTestEmail(templateType, email);

    return res.json({
      success: result,
      message: result
        ? `Test email sent successfully to ${email}`
        : 'Failed to send test email',
      templateType,
      recipient: email
    });

  } catch (error) {
    console.error('❌ Send test email failed:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to send test email',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Preview email template endpoint
 * נקודת קצה לתצוגה מקדימה של תבנית אימייל
 */
router.get('/preview-template/:templateType', async (req, res) => {
  try {
    const { templateType } = req.params;

    if (!['request-created', 'status-update', 'request-completed'].includes(templateType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid templateType. Must be: request-created, status-update, or request-completed'
      });
    }

    // Mock request data for preview
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
      return res.status(500).json({
        success: false,
        error: 'Failed to render template'
      });
    }

    // Return HTML for browser preview
    res.set('Content-Type', 'text/html; charset=utf-8');
    return res.send(emailContent.html);

  } catch (error) {
    console.error('❌ Template preview failed:', error);
    return res.status(500).json({
      success: false,
      error: 'Template preview failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get template service status
 * קבלת סטטוס שירות התבניות
 */
router.get('/template-status', (req, res) => {
  try {
    res.json({
      success: true,
      templateService: {
        isReady: templateService.isReady(),
        availableTemplates: templateService.getAvailableTemplates()
      },
      emailService: {
        isReady: emailService.isReady()
      }
    });
  } catch (error) {
    console.error('❌ Template status check failed:', error);
    res.status(500).json({
      success: false,
      error: 'Template status check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;