#!/usr/bin/env node

/**
 * SendGrid Integration Test Script for HelpSavta Production
 * This script tests SendGrid email service with Hebrew RTL templates
 */

const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  host: 'smtp.sendgrid.net',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: 'apikey',
    pass: process.env.SENDGRID_API_KEY || 'YOUR_SENDGRID_API_KEY_HERE'
  }
};

// Test email templates with Hebrew RTL content
const templates = {
  'test-basic': {
    subject: 'בדיקת חיבור SendGrid - Help Savta',
    html: `
      <!DOCTYPE html>
      <html lang="he" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>בדיקת SendGrid</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
            direction: rtl;
            text-align: right;
            color: #1f2937;
            line-height: 1.6;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #ffffff;
          }
          .header {
            background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 8px 8px 0 0;
          }
          .content {
            padding: 20px;
            border: 1px solid #e5e7eb;
            border-top: none;
            border-radius: 0 0 8px 8px;
          }
          .success-box {
            background-color: #f0fdf4;
            border: 1px solid #22c55e;
            border-right: 4px solid #22c55e;
            padding: 16px;
            border-radius: 6px;
            margin: 16px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Help Savta</h1>
            <p>עזרה טכנית בהתנדבות לקהילה</p>
          </div>
          <div class="content">
            <h2>✅ בדיקת SendGrid הצליחה!</h2>
            <div class="success-box">
              <p><strong>מערכת האימייל פועלת תקין</strong></p>
              <p>שירות SendGrid מחובר בהצלחה עם תמיכה מלאה בעברית RTL</p>
            </div>
            <p>פרטי הבדיקה:</p>
            <ul>
              <li>שרת SMTP: smtp.sendgrid.net</li>
              <li>יציאה: 587</li>
              <li>אימות: API Key</li>
              <li>כיוון טקסט: RTL (ימין לשמאל)</li>
              <li>קידוד: UTF-8</li>
            </ul>
            <p>תאריך בדיקה: ${new Date().toLocaleString('he-IL')}</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
בדיקת SendGrid - Help Savta

✅ מערכת האימייל פועלת תקין!

שירות SendGrid מחובר בהצלחה עם תמיכה מלאה בעברית RTL

פרטי הבדיקה:
- שרת SMTP: smtp.sendgrid.net  
- יציאה: 587
- אימות: API Key
- כיוון טקסט: RTL (ימין לשמאל)
- קידוד: UTF-8

תאריך בדיקה: ${new Date().toLocaleString('he-IL')}

בברכה,
צוות Help Savta
    `
  },
  
  'test-request-created': {
    subject: '[בדיקה] בקשה #999 התקבלה - Help Savta',
    html: `
      <!DOCTYPE html>
      <html lang="he" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
            direction: rtl;
            text-align: right;
            color: #1f2937;
            line-height: 1.6;
            background-color: #f9fafb;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          }
          .header {
            background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
            color: white;
            padding: 24px;
            text-align: center;
          }
          .content {
            padding: 32px 24px;
          }
          .greeting {
            font-size: 18px;
            font-weight: 600;
            color: #2563eb;
            margin-bottom: 16px;
          }
          .success-box {
            background-color: #f0fdf4;
            border: 1px solid #22c55e;
            border-right: 4px solid #22c55e;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
          }
          .request-details {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #e2e8f0;
          }
          .detail-row:last-child {
            border-bottom: none;
          }
          .detail-label {
            font-weight: 600;
            color: #374151;
          }
          .detail-value {
            color: #1f2937;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Help Savta (בדיקה)</h1>
            <div>עזרה טכנית בהתנדבות לקהילה</div>
          </div>
          <div class="content">
            <div class="greeting">שלום משתמש בדיקה,</div>
            <p>תודה רבה על פנייתך לשירות Help Savta! אנו מתרגשים לעזור לך עם הבעיה הטכנית שלך.</p>
            
            <div class="success-box">
              <h3>✅ הבקשה התקבלה בהצלחה</h3>
              <p>בקשתך נקלטה במערכת ונבדקת כעת על ידי הצוות שלנו. נחזור אליך בהקדם האפשרי.</p>
            </div>
            
            <div class="request-details">
              <h3>📋 פרטי הבקשה (בדיקה)</h3>
              <div class="detail-row">
                <span class="detail-label">מספר בקשה:</span>
                <span class="detail-value"><strong>#999</strong></span>
              </div>
              <div class="detail-row">
                <span class="detail-label">שם מלא:</span>
                <span class="detail-value">משתמש בדיקה</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">תיאור הבעיה:</span>
                <span class="detail-value">בדיקת תבנית אימייל עברית RTL</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">תאריך הגשה:</span>
                <span class="detail-value">${new Date().toLocaleString('he-IL')}</span>
              </div>
            </div>
            
            <p><strong>זהו אימייל בדיקה</strong> - לא מדובר בבקשה אמיתית.</p>
            <p>אם קיבלת אימייל זה, המשמעות היא ש-SendGrid פועל תקין עם תמיכה מלאה בעברית RTL.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
[בדיקה] בקשה #999 התקבלה - Help Savta

שלום משתמש בדיקה,

תודה רבה על פנייתך לשירות Help Savta!

✅ הבקשה התקבלה בהצלחה

פרטי הבקשה (בדיקה):
- מספר בקשה: #999
- שם מלא: משתמש בדיקה
- תיאור הבעיה: בדיקת תבנית אימייל עברית RTL
- תאריך הגשה: ${new Date().toLocaleString('he-IL')}

זהו אימייל בדיקה - לא מדובר בבקשה אמיתית.
אם קיבלת אימייל זה, המשמעות היא ש-SendGrid פועל תקין עם תמיכה מלאה בעברית RTL.

בברכה,
צוות Help Savta
    `
  }
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Validate configuration
function validateConfig() {
  log('\n🔍 בדיקת הגדרות SendGrid...', 'cyan');
  
  if (!config.auth.pass || config.auth.pass === 'YOUR_SENDGRID_API_KEY_HERE') {
    log('❌ שגיאה: SendGrid API Key לא הוגדר!', 'red');
    log('הגדר את המשתנה SENDGRID_API_KEY או ערוך את הסקריפט', 'yellow');
    log('דוגמה: export SENDGRID_API_KEY="SG.your-api-key-here"', 'yellow');
    return false;
  }
  
  if (!config.auth.pass.startsWith('SG.')) {
    log('⚠️  אזהרה: API Key לא נראה תקין (צריך להתחיל ב-SG.)', 'yellow');
  }
  
  log('✅ הגדרות נראות תקינות', 'green');
  return true;
}

// Test SMTP connection
async function testConnection() {
  log('\n🔌 בדיקת חיבור ל-SendGrid SMTP...', 'cyan');
  
  try {
    const transporter = nodemailer.createTransporter(config);
    await transporter.verify();
    log('✅ חיבור ל-SendGrid הצליח!', 'green');
    return transporter;
  } catch (error) {
    log('❌ שגיאה בחיבור ל-SendGrid:', 'red');
    log(`   ${error.message}`, 'red');
    
    if (error.code === 'EAUTH') {
      log('💡 רמז: בדוק שה-API Key תקין ויש לו הרשאות Mail Send', 'yellow');
    }
    
    return null;
  }
}

// Send test email
async function sendTestEmail(transporter, templateType, recipientEmail) {
  log(`\n📧 שליחת אימייל בדיקה (${templateType})...`, 'cyan');
  
  const template = templates[templateType];
  if (!template) {
    log(`❌ תבנית לא נמצאה: ${templateType}`, 'red');
    return false;
  }
  
  const mailOptions = {
    from: `"Help Savta (בדיקה)" <noreply@helpsavta.co.il>`,
    to: recipientEmail,
    subject: template.subject,
    text: template.text,
    html: template.html
  };
  
  try {
    const result = await transporter.sendMail(mailOptions);
    log(`✅ אימייל נשלח בהצלחה ל-${recipientEmail}`, 'green');
    log(`   Message ID: ${result.messageId}`, 'blue');
    return true;
  } catch (error) {
    log(`❌ שגיאה בשליחת אימייל ל-${recipientEmail}:`, 'red');
    log(`   ${error.message}`, 'red');
    return false;
  }
}

// Generate test report
function generateReport(results) {
  log('\n📊 דוח בדיקה מפורט:', 'magenta');
  log('═'.repeat(50), 'magenta');
  
  log(`🕒 זמן בדיקה: ${new Date().toLocaleString('he-IL')}`, 'cyan');
  log(`🔧 שרת SMTP: ${config.host}:${config.port}`, 'cyan');
  log(`🔑 אימות: API Key (${config.auth.pass.substring(0, 10)}...)`, 'cyan');
  
  let successCount = 0;
  let totalTests = 0;
  
  results.forEach(result => {
    totalTests++;
    if (result.success) {
      successCount++;
      log(`✅ ${result.test}: הצליח`, 'green');
    } else {
      log(`❌ ${result.test}: נכשל`, 'red');
    }
    
    if (result.details) {
      log(`   ${result.details}`, 'blue');
    }
  });
  
  log('\n📈 סיכום:', 'magenta');
  log(`   בדיקות שהצליחו: ${successCount}/${totalTests}`, successCount === totalTests ? 'green' : 'yellow');
  log(`   אחוז הצלחה: ${Math.round(successCount / totalTests * 100)}%`, successCount === totalTests ? 'green' : 'yellow');
  
  if (successCount === totalTests) {
    log('\n🎉 כל הבדיקות עברו בהצלחה! SendGrid מוכן לייצור.', 'green');
  } else {
    log('\n⚠️  יש בעיות שצריך לפתור לפני הפעלה בייצור.', 'yellow');
  }
}

// Main test function
async function runTests() {
  log('🧪 בדיקת SendGrid Integration - Help Savta', 'bright');
  log('=' .repeat(50), 'bright');
  
  const results = [];
  
  // Validate configuration
  if (!validateConfig()) {
    process.exit(1);
  }
  
  // Test connection
  const transporter = await testConnection();
  results.push({
    test: 'חיבור SMTP',
    success: !!transporter,
    details: transporter ? 'חיבור הצליח' : 'חיבור נכשל'
  });
  
  if (!transporter) {
    generateReport(results);
    process.exit(1);
  }
  
  // Get test email from command line or use default
  const testEmail = process.argv[2] || 'test@example.com';
  
  if (testEmail === 'test@example.com') {
    log('\n💡 רמז: אתה יכול להעביר כתובת אימייל כפרמטר:', 'yellow');
    log('   node test-sendgrid-integration.js your-email@example.com', 'yellow');
  }
  
  // Test basic email
  const basicTest = await sendTestEmail(transporter, 'test-basic', testEmail);
  results.push({
    test: 'אימייל בסיסי',
    success: basicTest,
    details: basicTest ? `נשלח ל-${testEmail}` : 'שליחה נכשלה'
  });
  
  // Test Hebrew RTL template
  const hebrewTest = await sendTestEmail(transporter, 'test-request-created', testEmail);
  results.push({
    test: 'תבנית עברית RTL',
    success: hebrewTest,
    details: hebrewTest ? `תבנית עברית נשלחה ל-${testEmail}` : 'שליחת תבנית עברית נכשלה'
  });
  
  // Generate final report
  generateReport(results);
  
  // Save results to file
  const reportFile = path.join(__dirname, 'sendgrid-test-report.json');
  const reportData = {
    timestamp: new Date().toISOString(),
    config: {
      host: config.host,
      port: config.port,
      testEmail: testEmail
    },
    results: results,
    summary: {
      totalTests: results.length,
      successCount: results.filter(r => r.success).length,
      successRate: Math.round(results.filter(r => r.success).length / results.length * 100)
    }
  };
  
  fs.writeFileSync(reportFile, JSON.stringify(reportData, null, 2), 'utf8');
  log(`\n💾 דוח מפורט נשמר ב: ${reportFile}`, 'blue');
}

// Help message
function showHelp() {
  log('🧪 בדיקת SendGrid Integration - Help Savta', 'bright');
  log('\nשימוש:', 'cyan');
  log('  node test-sendgrid-integration.js [email]', 'white');
  log('\nדוגמאות:', 'cyan');
  log('  node test-sendgrid-integration.js', 'white');
  log('  node test-sendgrid-integration.js admin@helpsavta.co.il', 'white');
  log('\nמשתני סביבה נדרשים:', 'cyan');
  log('  SENDGRID_API_KEY - SendGrid API Key', 'white');
  log('\nדוגמה:', 'cyan');
  log('  export SENDGRID_API_KEY="SG.your-api-key"', 'white');
  log('  node test-sendgrid-integration.js admin@helpsavta.co.il', 'white');
}

// Run tests or show help
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  showHelp();
} else {
  runTests().catch(error => {
    log('\n💥 שגיאה כללית בבדיקה:', 'red');
    log(error.message, 'red');
    process.exit(1);
  });
}