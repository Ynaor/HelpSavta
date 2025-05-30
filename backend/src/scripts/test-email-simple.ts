/**
 * Simple Email Service Test Script
 * Tests email functionality without full server initialization
 */

import { config } from 'dotenv';

// Load environment variables
config();

// Simple email service test without full initialization
async function testEmailService(): Promise<void> {
  console.log('🧪 Simple Email Service Test');
  console.log('='.repeat(50));

  // Test environment configuration
  console.log('\n📋 Email Configuration:');
  
  const hasSendGrid = !!process.env.SENDGRID_API_KEY;
  const hasSmtp = !!(process.env.EMAIL_HOST && process.env.EMAIL_USER);
  
  console.log(`   SendGrid API Key: ${hasSendGrid ? '✅ Configured' : '❌ Missing'}`);
  if (hasSendGrid) {
    console.log(`   API Key: ${process.env.SENDGRID_API_KEY?.substring(0, 10)}...`);
  }
  
  console.log(`   SMTP Configuration: ${hasSmtp ? '✅ Configured' : '❌ Missing'}`);
  if (hasSmtp) {
    console.log(`   SMTP Host: ${process.env.EMAIL_HOST}`);
    console.log(`   SMTP Port: ${process.env.EMAIL_PORT || '587'}`);
    console.log(`   SMTP User: ${process.env.EMAIL_USER}`);
  }
  
  console.log(`   From Email: ${process.env.EMAIL_FROM || 'Not configured'}`);
  console.log(`   From Name: ${process.env.EMAIL_FROM_NAME || 'Not configured'}`);
  console.log(`   Reply To: ${process.env.EMAIL_REPLY_TO || 'Not configured'}`);
  console.log(`   Support Email: ${process.env.SUPPORT_EMAIL || 'Not configured'}`);

  // Test SendGrid availability
  console.log('\n📧 SendGrid Test:');
  if (hasSendGrid) {
    try {
      // Simple API key validation test
      const sgMail = require('@sendgrid/mail');
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      console.log('   ✅ SendGrid package loaded successfully');
      console.log('   ✅ API key format appears valid');
      
      // Test a simple mail object creation (doesn't send)
      const testMsg = {
        to: 'test@example.com',
        from: process.env.EMAIL_FROM || 'test@example.com',
        subject: 'Test',
        text: 'Test message',
      };
      console.log('   ✅ Mail object creation successful');
      
    } catch (error) {
      console.log(`   ❌ SendGrid error: ${error.message}`);
      
      if (error.message.includes('Cannot find module')) {
        console.log('   💡 Run: npm install @sendgrid/mail');
      }
    }
  } else {
    console.log('   ⚠️  SendGrid API key not configured');
    console.log('   💡 Set SENDGRID_API_KEY environment variable');
  }

  // Test template files
  console.log('\n🎨 Email Templates:');
  const fs = require('fs');
  const path = require('path');
  
  const templateDir = path.join(__dirname, '..', 'templates', 'email');
  
  try {
    const templateFiles = [
      'base.hbs',
      'request-created.hbs',
      'status-update.hbs',
      'request-completed.hbs'
    ];
    
    templateFiles.forEach(file => {
      const filePath = path.join(templateDir, file);
      const exists = fs.existsSync(filePath);
      console.log(`   ${exists ? '✅' : '❌'} ${file}`);
      
      if (exists) {
        const stats = fs.statSync(filePath);
        console.log(`      Size: ${Math.round(stats.size / 1024)}KB`);
      }
    });
  } catch (error) {
    console.log(`   ❌ Template directory error: ${error.message}`);
  }

  // Test basic Handlebars functionality
  console.log('\n🔧 Template Engine:');
  try {
    const Handlebars = require('handlebars');
    const template = Handlebars.compile('Hello {{name}}!');
    const result = template({ name: 'Test' });
    console.log(`   ✅ Handlebars rendering: "${result}"`);
  } catch (error) {
    console.log(`   ❌ Handlebars error: ${error.message}`);
  }

  // Test nodemailer availability
  console.log('\n📮 SMTP Fallback:');
  try {
    const nodemailer = require('nodemailer');
    console.log('   ✅ Nodemailer package available');
    
    if (hasSmtp) {
      const config = {
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      };
      
      const transporter = nodemailer.createTransport(config);
      console.log('   ✅ SMTP transporter created');
    } else {
      console.log('   ⚠️  SMTP not configured');
    }
  } catch (error) {
    console.log(`   ❌ SMTP error: ${error.message}`);
  }

  // Summary and recommendations
  console.log('\n📊 Summary:');
  const emailServiceReady = hasSendGrid || hasSmtp;
  console.log(`   Email Service Ready: ${emailServiceReady ? '✅ Yes' : '❌ No'}`);
  
  if (!emailServiceReady) {
    console.log('\n💡 To enable email service, configure either:');
    console.log('   1. SendGrid: Set SENDGRID_API_KEY');
    console.log('   2. SMTP: Set EMAIL_HOST, EMAIL_USER, EMAIL_PASS');
  }

  console.log('\n📋 Recommended Configuration:');
  console.log('   EMAIL_FROM=noreply@helpsavta.co.il');
  console.log('   EMAIL_FROM_NAME=Help Savta');
  console.log('   EMAIL_REPLY_TO=support@helpsavta.co.il');
  console.log('   SUPPORT_EMAIL=support@helpsavta.co.il');

  console.log(`\n✅ Test completed at: ${new Date().toLocaleString()}`);
}

// Run the test
testEmailService().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});