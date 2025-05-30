#!/usr/bin/env node

/**
 * HelpSavta Production Verification Script
 * Comprehensive end-to-end testing of all application features
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Production URLs
const config = {
  backend: 'https://helpsavta-production-backend.azurewebsites.net',
  frontend: 'https://helpsavta-production-frontend.azurewebsites.net',
  timeout: 30000, // 30 seconds
  retries: 3
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

// HTTP client with retry logic
async function makeRequest(url, options = {}, retries = config.retries) {
  try {
    const response = await axios({
      ...options,
      url,
      timeout: config.timeout,
      validateStatus: () => true // Don't throw on HTTP errors
    });
    return response;
  } catch (error) {
    if (retries > 0 && (error.code === 'ECONNABORTED' || error.code === 'ENOTFOUND')) {
      log(`⏳ ניסיון ${config.retries - retries + 2}/${config.retries + 1} עבור ${url}`, 'yellow');
      await new Promise(resolve => setTimeout(resolve, 2000));
      return makeRequest(url, options, retries - 1);
    }
    throw error;
  }
}

// Test results storage
let testResults = {
  timestamp: new Date().toISOString(),
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    warnings: 0
  },
  tests: []
};

function addTest(name, status, details, response_time = 0) {
  testResults.tests.push({
    name,
    status,
    details,
    response_time,
    timestamp: new Date().toISOString()
  });
  
  testResults.summary.total++;
  if (status === 'pass') testResults.summary.passed++;
  else if (status === 'fail') testResults.summary.failed++;
  else if (status === 'warning') testResults.summary.warnings++;
  
  const statusColor = status === 'pass' ? 'green' : status === 'fail' ? 'red' : 'yellow';
  const statusIcon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⚠️';
  
  log(`${statusIcon} ${name}: ${details}`, statusColor);
  if (response_time > 0) {
    log(`   ⏱️  זמן תגובה: ${response_time}ms`, 'blue');
  }
}

// 1. Health Checks
async function testHealthChecks() {
  log('\n🏥 בדיקות בריאות מערכת...', 'cyan');
  
  // Backend health check
  try {
    const start = Date.now();
    const response = await makeRequest(`${config.backend}/health`);
    const responseTime = Date.now() - start;
    
    if (response.status === 200) {
      addTest('Backend Health', 'pass', `שרת Backend פעיל (${response.status})`, responseTime);
      
      // Check response content
      if (response.data && response.data.status === 'healthy') {
        addTest('Backend Status', 'pass', 'סטטוס: בריא');
      } else {
        addTest('Backend Status', 'warning', 'סטטוס לא ברור');
      }
    } else {
      addTest('Backend Health', 'fail', `שרת Backend לא זמין (${response.status})`);
    }
  } catch (error) {
    addTest('Backend Health', 'fail', `שגיאה בחיבור לBackend: ${error.message}`);
  }
  
  // Frontend availability
  try {
    const start = Date.now();
    const response = await makeRequest(config.frontend);
    const responseTime = Date.now() - start;
    
    if (response.status === 200) {
      addTest('Frontend Availability', 'pass', `אתר Frontend זמין (${response.status})`, responseTime);
      
      // Check if it's the correct app
      if (response.data && response.data.includes('Help Savta')) {
        addTest('Frontend Content', 'pass', 'תוכן נכון - Help Savta זוהה');
      } else {
        addTest('Frontend Content', 'warning', 'לא ניתן לזהות תוכן Help Savta');
      }
    } else {
      addTest('Frontend Availability', 'fail', `אתר Frontend לא זמין (${response.status})`);
    }
  } catch (error) {
    addTest('Frontend Availability', 'fail', `שגיאה בחיבור לFrontend: ${error.message}`);
  }
}

// 2. Database Connectivity
async function testDatabase() {
  log('\n🗄️ בדיקת מסד נתונים...', 'cyan');
  
  try {
    const start = Date.now();
    const response = await makeRequest(`${config.backend}/api/test/db-status`);
    const responseTime = Date.now() - start;
    
    if (response.status === 200) {
      addTest('Database Connection', 'pass', 'חיבור למסד נתונים תקין', responseTime);
      
      if (response.data) {
        if (response.data.connected) {
          addTest('Database Status', 'pass', 'מסד נתונים מחובר');
        }
        
        if (response.data.tables && response.data.tables.length > 0) {
          addTest('Database Tables', 'pass', `${response.data.tables.length} טבלאות נמצאו`);
        }
      }
    } else {
      addTest('Database Connection', 'fail', `בעיה בחיבור למסד נתונים (${response.status})`);
    }
  } catch (error) {
    addTest('Database Connection', 'fail', `שגיאה בבדיקת מסד נתונים: ${error.message}`);
  }
}

// 3. API Endpoints
async function testApiEndpoints() {
  log('\n🔌 בדיקת API endpoints...', 'cyan');
  
  const endpoints = [
    { path: '/api/requests', method: 'GET', name: 'Requests API' },
    { path: '/api/slots', method: 'GET', name: 'Slots API' },
    { path: '/api/calendar', method: 'GET', name: 'Calendar API' },
    { path: '/api/admin/stats', method: 'GET', name: 'Admin Stats API' }
  ];
  
  for (const endpoint of endpoints) {
    try {
      const start = Date.now();
      const response = await makeRequest(`${config.backend}${endpoint.path}`, {
        method: endpoint.method
      });
      const responseTime = Date.now() - start;
      
      // Most endpoints require authentication, so 401 is expected
      if (response.status === 200 || response.status === 401) {
        const status = response.status === 200 ? 'pass' : 'warning';
        const details = response.status === 200 ? 
          'Endpoint פעיל ומחזיר נתונים' : 
          'Endpoint פעיל (דורש אימות)';
        addTest(endpoint.name, status, details, responseTime);
      } else {
        addTest(endpoint.name, 'fail', `Endpoint לא זמין (${response.status})`);
      }
    } catch (error) {
      addTest(endpoint.name, 'fail', `שגיאה ב-${endpoint.name}: ${error.message}`);
    }
  }
}

// 4. Email Service Test
async function testEmailService() {
  log('\n📧 בדיקת שירות אימייל...', 'cyan');
  
  try {
    const start = Date.now();
    const response = await makeRequest(`${config.backend}/api/test/email-config`);
    const responseTime = Date.now() - start;
    
    if (response.status === 200) {
      addTest('Email Service Config', 'pass', 'הגדרות אימייל זמינות', responseTime);
      
      if (response.data) {
        if (response.data.configured) {
          addTest('Email Configuration', 'pass', 'שירות אימייל מוגדר');
        } else {
          addTest('Email Configuration', 'warning', 'שירות אימייל לא מוגדר');
        }
        
        if (response.data.smtp_host) {
          addTest('SMTP Configuration', 'pass', `SMTP: ${response.data.smtp_host}`);
        }
      }
    } else {
      addTest('Email Service Config', 'fail', `לא ניתן לבדוק הגדרות אימייל (${response.status})`);
    }
  } catch (error) {
    addTest('Email Service Config', 'fail', `שגיאה בבדיקת שירות אימייל: ${error.message}`);
  }
}

// 5. Frontend Features Test
async function testFrontendFeatures() {
  log('\n🎯 בדיקת תכונות Frontend...', 'cyan');
  
  const routes = [
    { path: '/', name: 'Home Page' },
    { path: '/request-help', name: 'Request Help Page' },
    { path: '/admin', name: 'Admin Login Page' }
  ];
  
  for (const route of routes) {
    try {
      const start = Date.now();
      const response = await makeRequest(`${config.frontend}${route.path}`);
      const responseTime = Date.now() - start;
      
      if (response.status === 200) {
        addTest(route.name, 'pass', 'דף נטען בהצלחה', responseTime);
        
        // Check for Hebrew content
        if (response.data && response.data.includes('עברית') || 
            response.data.includes('בקשה') || 
            response.data.includes('עזרה')) {
          addTest(`${route.name} Hebrew`, 'pass', 'תוכן עברי זוהה');
        }
      } else {
        addTest(route.name, 'fail', `דף לא זמין (${response.status})`);
      }
    } catch (error) {
      addTest(route.name, 'fail', `שגיאה בטעינת ${route.name}: ${error.message}`);
    }
  }
}

// 6. Performance Tests
async function testPerformance() {
  log('\n⚡ בדיקות ביצועים...', 'cyan');
  
  const performanceTests = [
    { url: config.backend + '/health', name: 'Backend Response Time' },
    { url: config.frontend, name: 'Frontend Load Time' }
  ];
  
  for (const test of performanceTests) {
    try {
      const start = Date.now();
      const response = await makeRequest(test.url);
      const responseTime = Date.now() - start;
      
      if (response.status === 200) {
        let status = 'pass';
        let details = `${responseTime}ms`;
        
        if (responseTime > 5000) {
          status = 'fail';
          details += ' (איטי מדי)';
        } else if (responseTime > 2000) {
          status = 'warning';
          details += ' (איטי)';
        } else {
          details += ' (מהיר)';
        }
        
        addTest(test.name, status, details, responseTime);
      }
    } catch (error) {
      addTest(test.name, 'fail', `שגיאה במדידת ביצועים: ${error.message}`);
    }
  }
}

// 7. Security Headers Test
async function testSecurityHeaders() {
  log('\n🔒 בדיקת אבטחה...', 'cyan');
  
  try {
    const response = await makeRequest(config.frontend);
    
    const securityHeaders = [
      'x-frame-options',
      'x-content-type-options',
      'x-xss-protection',
      'strict-transport-security'
    ];
    
    let secureHeaders = 0;
    securityHeaders.forEach(header => {
      if (response.headers[header]) {
        secureHeaders++;
        addTest(`Security Header: ${header}`, 'pass', 'מוגדר');
      } else {
        addTest(`Security Header: ${header}`, 'warning', 'לא מוגדר');
      }
    });
    
    if (secureHeaders >= 3) {
      addTest('Overall Security', 'pass', `${secureHeaders}/${securityHeaders.length} כותרות אבטחה`);
    } else {
      addTest('Overall Security', 'warning', `רק ${secureHeaders}/${securityHeaders.length} כותרות אבטחה`);
    }
    
  } catch (error) {
    addTest('Security Headers', 'fail', `שגיאה בבדיקת אבטחה: ${error.message}`);
  }
}

// Generate comprehensive report
function generateReport() {
  log('\n📊 דוח וריפיקציה מפורט:', 'magenta');
  log('═'.repeat(60), 'magenta');
  
  const { summary } = testResults;
  const successRate = Math.round((summary.passed / summary.total) * 100);
  
  log(`🕒 זמן בדיקה: ${new Date(testResults.timestamp).toLocaleString('he-IL')}`, 'cyan');
  log(`🔗 Backend: ${config.backend}`, 'cyan');
  log(`🔗 Frontend: ${config.frontend}`, 'cyan');
  
  log('\n📈 סיכום תוצאות:', 'bright');
  log(`   ✅ עבר: ${summary.passed}`, 'green');
  log(`   ❌ נכשל: ${summary.failed}`, 'red');
  log(`   ⚠️  אזהרות: ${summary.warnings}`, 'yellow');
  log(`   📊 סה"כ: ${summary.total}`, 'blue');
  log(`   🎯 אחוז הצלחה: ${successRate}%`, successRate >= 80 ? 'green' : 'yellow');
  
  // Categorize results
  log('\n📋 פירוט לפי קטגוריות:', 'bright');
  
  const categories = {
    'בריאות מערכת': ['Backend Health', 'Frontend Availability', 'Backend Status', 'Frontend Content'],
    'מסד נתונים': ['Database Connection', 'Database Status', 'Database Tables'],
    'API': ['Requests API', 'Slots API', 'Calendar API', 'Admin Stats API'],
    'שירות אימייל': ['Email Service Config', 'Email Configuration', 'SMTP Configuration'],
    'Frontend': ['Home Page', 'Request Help Page', 'Admin Login Page'],
    'ביצועים': ['Backend Response Time', 'Frontend Load Time'],
    'אבטחה': ['Overall Security']
  };
  
  Object.entries(categories).forEach(([category, tests]) => {
    const categoryTests = testResults.tests.filter(test => 
      tests.some(testName => test.name.includes(testName))
    );
    
    if (categoryTests.length > 0) {
      const categoryPassed = categoryTests.filter(test => test.status === 'pass').length;
      const categoryStatus = categoryPassed === categoryTests.length ? '✅' : 
                           categoryPassed > categoryTests.length / 2 ? '⚠️' : '❌';
      
      log(`   ${categoryStatus} ${category}: ${categoryPassed}/${categoryTests.length}`, 'cyan');
    }
  });
  
  // Production readiness assessment
  log('\n🚀 הערכת מוכנות לייצור:', 'bright');
  
  const criticalFailures = testResults.tests.filter(test => 
    test.status === 'fail' && 
    (test.name.includes('Backend Health') || 
     test.name.includes('Frontend Availability') || 
     test.name.includes('Database Connection'))
  );
  
  if (criticalFailures.length === 0 && successRate >= 80) {
    log('🎉 המערכת מוכנה לייצור!', 'green');
    log('   כל המרכיבים הקריטיים פועלים תקין', 'green');
  } else if (criticalFailures.length === 0 && successRate >= 60) {
    log('⚠️  המערכת כמעט מוכנה לייצור', 'yellow');
    log('   יש כמה בעיות לא קריטיות שכדאי לתקן', 'yellow');
  } else {
    log('❌ המערכת לא מוכנה לייצור', 'red');
    log('   יש בעיות קריטיות שחייבות לתקן', 'red');
    
    if (criticalFailures.length > 0) {
      log('\n🚨 בעיות קריטיות:', 'red');
      criticalFailures.forEach(failure => {
        log(`   • ${failure.name}: ${failure.details}`, 'red');
      });
    }
  }
  
  // Recommendations
  const warnings = testResults.tests.filter(test => test.status === 'warning');
  const failures = testResults.tests.filter(test => test.status === 'fail');
  
  if (warnings.length > 0 || failures.length > 0) {
    log('\n💡 המלצות לשיפור:', 'yellow');
    
    if (failures.some(f => f.name.includes('Email'))) {
      log('   📧 השלם הגדרת SendGrid לשירות אימייל', 'yellow');
    }
    
    if (warnings.some(w => w.name.includes('Security'))) {
      log('   🔒 הוסף כותרות אבטחה נוספות', 'yellow');
    }
    
    if (failures.some(f => f.name.includes('Response Time')) || 
        warnings.some(w => w.name.includes('Response Time'))) {
      log('   ⚡ שפר ביצועי המערכת', 'yellow');
    }
  }
  
  return successRate;
}

// Save detailed report to file
function saveReportToFile() {
  const reportFile = path.join(__dirname, 'production-verification-report.json');
  const detailedReport = {
    ...testResults,
    config: {
      backend_url: config.backend,
      frontend_url: config.frontend,
      timeout: config.timeout
    },
    assessment: {
      production_ready: testResults.summary.failed === 0 && 
                       testResults.summary.passed >= testResults.summary.total * 0.8,
      critical_issues: testResults.tests.filter(test => 
        test.status === 'fail' && 
        (test.name.includes('Backend Health') || 
         test.name.includes('Frontend Availability') || 
         test.name.includes('Database Connection'))
      ).length,
      success_rate: Math.round((testResults.summary.passed / testResults.summary.total) * 100)
    }
  };
  
  fs.writeFileSync(reportFile, JSON.stringify(detailedReport, null, 2), 'utf8');
  log(`\n💾 דוח מפורט נשמר ב: ${reportFile}`, 'blue');
  
  return reportFile;
}

// Main verification function
async function runVerification() {
  log('🔍 HelpSavta Production Verification', 'bright');
  log('=' .repeat(60), 'bright');
  log(`Backend: ${config.backend}`, 'blue');
  log(`Frontend: ${config.frontend}`, 'blue');
  log(`Timeout: ${config.timeout}ms`, 'blue');
  
  try {
    await testHealthChecks();
    await testDatabase();
    await testApiEndpoints();
    await testEmailService();
    await testFrontendFeatures();
    await testPerformance();
    await testSecurityHeaders();
    
    const successRate = generateReport();
    const reportFile = saveReportToFile();
    
    log('\n🏁 וריפיקציה הושלמה!', 'bright');
    
    // Exit with appropriate code
    if (successRate >= 80 && testResults.summary.failed === 0) {
      process.exit(0); // Success
    } else if (successRate >= 60) {
      process.exit(1); // Warning
    } else {
      process.exit(2); // Critical issues
    }
    
  } catch (error) {
    log('\n💥 שגיאה כללית בוריפיקציה:', 'red');
    log(error.message, 'red');
    process.exit(3);
  }
}

// Help message
function showHelp() {
  log('🔍 HelpSavta Production Verification', 'bright');
  log('\nשימוש:', 'cyan');
  log('  node production-verification.js', 'white');
  log('\nמה הסקריפט בודק:', 'cyan');
  log('  ✅ בריאות שרתים (Backend + Frontend)', 'white');
  log('  ✅ חיבור למסד נתונים', 'white');
  log('  ✅ API endpoints', 'white');
  log('  ✅ שירות אימייל (SendGrid)', 'white');
  log('  ✅ דפי Frontend', 'white');
  log('  ✅ ביצועי מערכת', 'white');
  log('  ✅ הגדרות אבטחה', 'white');
  log('\nקודי יציאה:', 'cyan');
  log('  0 - הכל תקין (מוכן לייצור)', 'green');
  log('  1 - אזהרות (כמעט מוכן)', 'yellow');
  log('  2 - בעיות קריטיות', 'red');
  log('  3 - שגיאה כללית', 'red');
}

// Run verification or show help
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  showHelp();
} else {
  runVerification();
}