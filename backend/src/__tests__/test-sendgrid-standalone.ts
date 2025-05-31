#!/usr/bin/env node

/**
 * Standalone SendGrid Test Script for Help Savta
 * Test script to verify SendGrid configuration without starting the server
 */

import * as dotenv from 'dotenv';
import sgMail from '@sendgrid/mail';

// Load environment variables
dotenv.config();

interface TestConfig {
  recipientEmail: string;
  testType: 'simple' | 'template' | 'both';
}

/**
 * Parse command line arguments
 */
function parseArgs(): TestConfig {
  const args = process.argv.slice(2);
  const recipientEmail = args[0] || 'yuval3250@gmail.com';
  const testType = (args[1] as 'simple' | 'template' | 'both') || 'both';

  return { recipientEmail, testType };
}

/**
 * Initialize SendGrid
 */
function initializeSendGrid(): boolean {
  try {
    const apiKey = process.env.SENDGRID_API_KEY;
    
    if (!apiKey) {
      console.error('❌ SENDGRID_API_KEY environment variable is required');
      return false;
    }

    if (!apiKey.startsWith('SG.')) {
      console.warn('⚠️ SendGrid API key format may be invalid (should start with "SG.")');
    }

    sgMail.setApiKey(apiKey);
    console.log('✅ SendGrid initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize SendGrid:', error);
    return false;
  }
}

/**
 * Test simple email sending
 */
async function testSimpleEmail(recipientEmail: string): Promise<boolean> {
  console.log('\n🧪 Testing Simple Email...');
  
  try {
    const fromEmail = process.env.EMAIL_FROM || 'noreply@helpsavta.com';
    const fromName = process.env.EMAIL_FROM_NAME || 'Help Savta';
    const replyToEmail = process.env.EMAIL_REPLY_TO || 'support@helpsavta.com';

    const msg = {
      to: recipientEmail,
      from: {
        email: fromEmail,
        name: fromName
      },
      replyTo: replyToEmail,
      subject: '[בדיקה] SendGrid Integration - Help Savta',
      text: `
שלום!

זהו אימייל בדיקה עבור Help Savta.

הגדרות הנוכחיות:
- דומיין: helpsavta.com
- שולח: ${fromEmail}
- שם שולח: ${fromName}
- מענה: ${replyToEmail}

✅ SendGrid פועל תקין!

בברכה,
צוות Help Savta

נשלח ב: ${new Date().toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' })}
      `,
      html: `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>בדיקת אימייל - Help Savta</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #0066cc; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .config-item { background: white; padding: 10px; margin: 5px 0; border-right: 4px solid #0066cc; }
        .footer { text-align: center; margin-top: 20px; color: #666; }
        .success { background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-right: 4px solid #22c55e; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧪 בדיקת אימייל - Help Savta</h1>
        </div>
        <div class="content">
            <p><strong>שלום!</strong></p>
            <p>זהו אימייל בדיקה עבור Help Savta עם הדומיין החדש.</p>
            
            <div class="success">
                <h3>✅ SendGrid פועל תקין!</h3>
                <p>שירות SendGrid מחובר בהצלחה עם תמיכה מלאה בעברית RTL.</p>
            </div>
            
            <h3>הגדרות הנוכחיות:</h3>
            <div class="config-item"><strong>דומיין:</strong> helpsavta.com</div>
            <div class="config-item"><strong>שולח:</strong> ${fromEmail}</div>
            <div class="config-item"><strong>שם שולח:</strong> ${fromName}</div>
            <div class="config-item"><strong>מענה:</strong> ${replyToEmail}</div>
            <div class="config-item"><strong>תמיכה:</strong> ${process.env.SUPPORT_EMAIL || 'support@helpsavta.com'}</div>
            
            <p>פרטי הבדיקה:</p>
            <ul>
                <li>שירות: SendGrid API</li>
                <li>כיוון טקסט: RTL (ימין לשמאל)</li>
                <li>קידוד: UTF-8</li>
                <li>תאריך בדיקה: ${new Date().toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' })}</li>
            </ul>
        </div>
        <div class="footer">
            <p>בברכה,<br>צוות Help Savta</p>
            <p><small>נשלח ב: ${new Date().toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' })}</small></p>
        </div>
    </div>
</body>
</html>
      `,
      trackingSettings: {
        clickTracking: {
          enable: false
        },
        openTracking: {
          enable: false
        }
      },
      customArgs: {
        templateType: 'test-basic'
      }
    };

    await sgMail.send(msg);
    console.log('✅ Simple email sent successfully!');
    return true;
  } catch (error) {
    console.error('❌ Exception during simple email test:', error);
    return false;
  }
}

/**
 * Test template-style email sending
 */
async function testTemplateEmail(recipientEmail: string): Promise<boolean> {
  console.log('\n🧪 Testing Template-Style Email...');
  
  try {
    const fromEmail = process.env.EMAIL_FROM || 'noreply@helpsavta.com';
    const fromName = process.env.EMAIL_FROM_NAME || 'Help Savta';
    const replyToEmail = process.env.EMAIL_REPLY_TO || 'support@helpsavta.com';

    // Mock request data for template testing
    const mockRequest = {
      id: 999,
      full_name: 'בדיקה אוטומטית',
      phone: '050-1234567',
      email: recipientEmail,
      address: 'תל אביב, ישראל',
      problem_description: 'בדיקת אימייל עם התבנית החדשה של Help Savta',
      urgency_level: 'medium',
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      notes: 'אימייל בדיקה אוטומטי עם הדומיין החדש helpsavta.com'
    };

    const msg = {
      to: recipientEmail,
      from: {
        email: fromEmail,
        name: `${fromName} (בדיקה)`
      },
      replyTo: replyToEmail,
      subject: '[בדיקה] בקשה #999 התקבלה - Help Savta',
      text: `
שלום ${mockRequest.full_name}!

תודה על פנייתך לשירות Help Savta!

פרטי הבקשה:
- מספר בקשה: #${mockRequest.id}
- תיאור הבעיה: ${mockRequest.problem_description}
- רמת דחיפות: ${mockRequest.urgency_level}
- סטטוס: ${mockRequest.status}

נחזור אליך בהקדם האפשרי.

זהו אימייל בדיקה - לא מדובר בבקשה אמיתית.

לכל שאלה או עזרה נוספת, אנא צור קשר:
- אימייל: ${replyToEmail}
- טלפון: ${process.env.SUPPORT_PHONE || '03-1234567'}

בברכה,
צוות Help Savta

נשלח ב: ${new Date().toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' })}
      `,
      html: `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>בקשה התקבלה - Help Savta</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #0066cc; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .request-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-right: 4px solid #0066cc; }
        .test-notice { background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-right: 4px solid #f59e0b; }
        .contact-info { background-color: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0; border-right: 4px solid #0ea5e9; }
        .footer { text-align: center; margin-top: 20px; color: #666; }
        .status-badge { background-color: #fbbf24; color: #92400e; padding: 4px 12px; border-radius: 20px; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📋 בקשה התקבלה בהצלחה!</h1>
        </div>
        <div class="content">
            <p><strong>שלום ${mockRequest.full_name},</strong></p>
            <p>תודה על פנייתך לשירות Help Savta! אנו מתחייבים לטפל בבקשתך בהקדם האפשרי.</p>
            
            <div class="test-notice">
                <strong>⚠️ הודעה:</strong> זהו אימייל בדיקה - לא מדובר בבקשה אמיתית.
            </div>
            
            <div class="request-details">
                <h3>פרטי הבקשה:</h3>
                <p><strong>מספר בקשה:</strong> #${mockRequest.id}</p>
                <p><strong>תיאור הבעיה:</strong> ${mockRequest.problem_description}</p>
                <p><strong>רמת דחיפות:</strong> ${mockRequest.urgency_level}</p>
                <p><strong>סטטוס נוכחי:</strong> <span class="status-badge">${mockRequest.status}</span></p>
                <p><strong>תאריך יצירה:</strong> ${new Date(mockRequest.created_at).toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' })}</p>
            </div>
            
            <div class="contact-info">
                <h4>פרטי יצירת קשר:</h4>
                <p><strong>אימייל תמיכה:</strong> ${replyToEmail}</p>
                <p><strong>טלפון:</strong> ${process.env.SUPPORT_PHONE || '03-1234567'}</p>
            </div>
            
            <p>נחזור אליך עם עדכונים ופרטי התיאום בהמשך.</p>
        </div>
        <div class="footer">
            <p>בברכה,<br><strong>צוות Help Savta</strong></p>
            <p><small>נשלח ב: ${new Date().toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' })}</small></p>
        </div>
    </div>
</body>
</html>
      `,
      trackingSettings: {
        clickTracking: {
          enable: false
        },
        openTracking: {
          enable: false
        }
      },
      customArgs: {
        requestId: mockRequest.id.toString(),
        templateType: 'test-request-created'
      }
    };

    await sgMail.send(msg);
    console.log('✅ Template email sent successfully!');
    return true;
  } catch (error) {
    console.error('❌ Exception during template email test:', error);
    return false;
  }
}

/**
 * Display configuration summary
 */
function displayConfiguration() {
  console.log('\n📋 Current SendGrid Configuration:');
  console.log('═'.repeat(50));
  console.log(`🔑 API Key: ${process.env.SENDGRID_API_KEY ? '✅ Set' : '❌ Missing'}`);
  console.log(`📧 From Email: ${process.env.EMAIL_FROM || 'noreply@helpsavta.com'}`);
  console.log(`👤 From Name: ${process.env.EMAIL_FROM_NAME || 'Help Savta'}`);
  console.log(`↩️  Reply To: ${process.env.EMAIL_REPLY_TO || 'support@helpsavta.com'}`);
  console.log(`🆘 Support Email: ${process.env.SUPPORT_EMAIL || 'support@helpsavta.com'}`);
  console.log(`🌐 Template Base URL: ${process.env.EMAIL_TEMPLATE_BASE_URL || 'https://helpsavta.com'}`);
  console.log('═'.repeat(50));
}

/**
 * Main test function
 */
async function main() {
  console.log('🚀 Help Savta SendGrid Standalone Test Script');
  console.log('Testing with official domain: helpsavta.com\n');

  const config = parseArgs();
  console.log(`📬 Test recipient: ${config.recipientEmail}`);
  console.log(`🧪 Test type: ${config.testType}`);

  displayConfiguration();

  // Validate required environment variables
  if (!process.env.SENDGRID_API_KEY) {
    console.error('\n❌ SENDGRID_API_KEY environment variable is required');
    console.log('\n💡 Please add your SendGrid API key to the .env file:');
    console.log('   SENDGRID_API_KEY=SG.your-api-key-here');
    console.log('\n📚 How to get your SendGrid API key:');
    console.log('   1. Go to https://app.sendgrid.com/settings/api_keys');
    console.log('   2. Click "Create API Key"');
    console.log('   3. Choose "Full Access" or "Restricted Access" with Mail Send permissions');
    console.log('   4. Copy the key and add it to your .env file');
    process.exit(1);
  }

  // Initialize SendGrid
  if (!initializeSendGrid()) {
    console.error('❌ Failed to initialize SendGrid');
    process.exit(1);
  }

  try {
    let simpleSuccess = true;
    let templateSuccess = true;

    // Run tests based on configuration
    if (config.testType === 'simple' || config.testType === 'both') {
      simpleSuccess = await testSimpleEmail(config.recipientEmail);
    }

    if (config.testType === 'template' || config.testType === 'both') {
      templateSuccess = await testTemplateEmail(config.recipientEmail);
    }

    // Summary
    console.log('\n📊 Test Results Summary:');
    console.log('═'.repeat(50));
    
    if (config.testType === 'simple' || config.testType === 'both') {
      console.log(`Simple Email: ${simpleSuccess ? '✅ PASSED' : '❌ FAILED'}`);
    }
    
    if (config.testType === 'template' || config.testType === 'both') {
      console.log(`Template Email: ${templateSuccess ? '✅ PASSED' : '❌ FAILED'}`);
    }

    const overallSuccess = simpleSuccess && templateSuccess;
    console.log(`Overall Result: ${overallSuccess ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    
    if (overallSuccess) {
      console.log('\n🎉 SendGrid is configured correctly with helpsavta.com domain!');
      console.log('📧 Check your email inbox for the test messages.');
      console.log('\n📝 Next Steps:');
      console.log('   1. Check your email inbox at ' + config.recipientEmail);
      console.log('   2. Verify that emails show "helpsavta.com" domain');
      console.log('   3. Check that Reply-To is set to support@helpsavta.com');
      console.log('   4. Ensure Hebrew RTL text displays correctly');
    } else {
      console.log('\n⚠️  Some tests failed. Please check the configuration and try again.');
      console.log('\n🔍 Troubleshooting:');
      console.log('   1. Verify your SendGrid API key is correct');
      console.log('   2. Check that your API key has Mail Send permissions');
      console.log('   3. Ensure your SendGrid account is not suspended');
      console.log('   4. Verify that helpsavta.com domain is authenticated in SendGrid');
    }

    console.log('\n💡 Need help? Contact: support@helpsavta.com');

  } catch (error) {
    console.error('\n❌ Fatal error during testing:', error);
    process.exit(1);
  }
}

/**
 * Display usage information
 */
function displayUsage() {
  console.log('\n📖 Usage:');
  console.log('  npm run test:sendgrid-standalone [recipient-email] [test-type]');
  console.log('  npm run test:sendgrid-standalone yuval3250@gmail.com simple');
  console.log('  npm run test:sendgrid-standalone yuval3250@gmail.com template');
  console.log('  npm run test:sendgrid-standalone yuval3250@gmail.com both');
  console.log('\n📝 Test Types:');
  console.log('  simple   - Send a simple test email');
  console.log('  template - Send a template-style email');
  console.log('  both     - Send both types (default)');
  console.log('\n🔧 Required Environment Variables:');
  console.log('  SENDGRID_API_KEY="SG.your-api-key"');
  console.log('  EMAIL_FROM="noreply@helpsavta.com"');
  console.log('  EMAIL_FROM_NAME="Help Savta"');
  console.log('  EMAIL_REPLY_TO="support@helpsavta.com"');
  console.log('  SUPPORT_EMAIL="support@helpsavta.com"');
}

// Handle help flag
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  displayUsage();
  process.exit(0);
}

// Run the main function
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Unhandled error:', error);
    process.exit(1);
  });
}

export { main as testSendGridStandalone };