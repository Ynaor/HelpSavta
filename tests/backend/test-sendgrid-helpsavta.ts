#!/usr/bin/env node

/**
 * SendGrid Test Script for Help Savta
 * Test script to verify SendGrid configuration with the official helpsavta.com domain
 */

import * as dotenv from 'dotenv';
import { sendGridService } from '../services/sendGridService';

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
 * Test simple email sending
 */
async function testSimpleEmail(recipientEmail: string): Promise<boolean> {
  console.log('\n🧪 Testing Simple Email...');
  
  try {
    // Create a simple email for testing
    const emailOptions = {
      to: recipientEmail,
      subject: '[Test] Help Savta Email Configuration Test',
      text: `
שלום!

זהו אימייל בדיקה עבור Help Savta.

הגדרות הנוכחיות:
- דומיין: helpsavta.com
- שולח: ${process.env.EMAIL_FROM || 'noreply@helpsavta.com'}
- שם שולח: ${process.env.EMAIL_FROM_NAME || 'Help Savta'}
- מענה: ${process.env.EMAIL_REPLY_TO || 'support@helpsavta.com'}

בברכה,
צוות Help Savta
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
            
            <h3>הגדרות הנוכחיות:</h3>
            <div class="config-item"><strong>דומיין:</strong> helpsavta.com</div>
            <div class="config-item"><strong>שולח:</strong> ${process.env.EMAIL_FROM || 'noreply@helpsavta.com'}</div>
            <div class="config-item"><strong>שם שולח:</strong> ${process.env.EMAIL_FROM_NAME || 'Help Savta'}</div>
            <div class="config-item"><strong>מענה:</strong> ${process.env.EMAIL_REPLY_TO || 'support@helpsavta.com'}</div>
            <div class="config-item"><strong>תמיכה:</strong> ${process.env.SUPPORT_EMAIL || 'support@helpsavta.com'}</div>
            
            <p>אם קיבלת אימייל זה, הגדרת SendGrid עובדת כהלכה! ✅</p>
        </div>
        <div class="footer">
            <p>בברכה,<br>צוות Help Savta</p>
            <p><small>נשלח ב: ${new Date().toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' })}</small></p>
        </div>
    </div>
</body>
</html>
      `
    };

    // Use sendTestEmail method instead of sendEmail
    const result = await sendGridService.sendTestEmail('basic', recipientEmail);

    if (result) {
      console.log('✅ Simple email sent successfully!');
      return true;
    } else {
      console.log('❌ Failed to send simple email');
      return false;
    }
  } catch (error) {
    console.error('❌ Exception during simple email test:', error);
    return false;
  }
}

/**
 * Test template-based email sending
 */
async function testTemplateEmail(recipientEmail: string): Promise<boolean> {
  console.log('\n🧪 Testing Template Email...');
  
  try {
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

    const result = await sendGridService.sendTestEmail('request-created', recipientEmail);

    if (result) {
      console.log('✅ Template email sent successfully!');
      return true;
    } else {
      console.log('❌ Failed to send template email');
      return false;
    }
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
  console.log('🚀 Help Savta SendGrid Test Script');
  console.log('Testing with official domain: helpsavta.com\n');

  const config = parseArgs();
  console.log(`📬 Test recipient: ${config.recipientEmail}`);
  console.log(`🧪 Test type: ${config.testType}`);

  displayConfiguration();

  // Validate required environment variables
  if (!process.env.SENDGRID_API_KEY) {
    console.error('\n❌ SENDGRID_API_KEY environment variable is required');
    console.log('\n💡 Set it with: export SENDGRID_API_KEY="SG.your-api-key"');
    process.exit(1);
  }

  try {
    // Check SendGrid service status
    console.log('\n🔄 Checking SendGrid service status...');
    if (!sendGridService.isReady()) {
      console.error('❌ SendGrid service is not configured properly');
      process.exit(1);
    }
    console.log('✅ SendGrid service is ready');

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
    } else {
      console.log('\n⚠️  Some tests failed. Please check the configuration and try again.');
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
  console.log('  npm run test:sendgrid [recipient-email] [test-type]');
  console.log('  npm run test:sendgrid yuval3250@gmail.com simple');
  console.log('  npm run test:sendgrid yuval3250@gmail.com template');
  console.log('  npm run test:sendgrid yuval3250@gmail.com both');
  console.log('\n📝 Test Types:');
  console.log('  simple   - Send a simple test email');
  console.log('  template - Send a template-based email');
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

export { main as testSendGrid };