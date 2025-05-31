/**
 * Email Service Test Script
 * Tests both SendGrid and SMTP email functionality
 */

// Import email service without starting the server
import '../config/environment'; // Load environment variables
import { emailService } from '../services/emailService';

interface TestResult {
  test: string;
  success: boolean;
  details: string;
  error?: string;
}

class EmailServiceTester {
  private results: TestResult[] = [];

  /**
   * Run all email service tests
   */
  async runAllTests(): Promise<void> {
    console.log('🧪 Starting Email Service Tests');
    console.log('='.repeat(50));

    // Test service initialization
    await this.testServiceInitialization();

    // Test template rendering
    await this.testTemplateRendering();

    // Test email functionality (if configured)
    await this.testEmailFunctionality();

    // Generate report
    this.generateReport();
  }

  /**
   * Test service initialization
   */
  private async testServiceInitialization(): Promise<void> {
    console.log('\n📋 Testing Service Initialization...');

    try {
      const isReady = emailService.isReady();
      this.addResult('Service Initialization', isReady, 
        isReady ? 'Email service initialized successfully' : 'Email service not configured');

      // Test connection if ready
      if (isReady) {
        try {
          const connectionTest = await emailService.testConnection();
          this.addResult('Connection Test', connectionTest,
            connectionTest ? 'Email connection successful' : 'Email connection failed');
        } catch (error) {
          this.addResult('Connection Test', false, 'Connection test failed', error.message);
        }
      }
    } catch (error) {
      this.addResult('Service Initialization', false, 'Failed to initialize service', error.message);
    }
  }

  /**
   * Test email template rendering
   */
  private async testTemplateRendering(): Promise<void> {
    console.log('\n🎨 Testing Email Templates...');

    const mockRequest = {
      id: 999,
      full_name: 'משתמש בדיקה',
      phone: '050-9999999',
      email: 'test@example.com',
      address: 'כתובת בדיקה 123, עיר הבדיקה',
      problem_description: 'זהו אימייל בדיקה למערכת Help Savta.',
      urgency_level: 'medium',
      status: 'pending',
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
      const testResult = await emailService.testEmailTemplates();
      
      if (testResult.success) {
        this.addResult('Template Rendering', true, 
          `All ${testResult.results.length} templates rendered successfully`);
        
        testResult.results.forEach(result => {
          this.addResult(`Template: ${result.template}`, result.success,
            `Subject: ${result.subject}, HTML: ${result.hasHtml}, Text: ${result.hasText}`);
        });
      } else {
        this.addResult('Template Rendering', false, 'Template rendering failed');
      }
    } catch (error) {
      this.addResult('Template Rendering', false, 'Template test failed', error.message);
    }
  }

  /**
   * Test actual email functionality
   */
  private async testEmailFunctionality(): Promise<void> {
    console.log('\n📧 Testing Email Functionality...');

    if (!emailService.isReady()) {
      this.addResult('Email Functionality', false, 'Email service not configured');
      return;
    }

    // Test with mock data
    const mockRequest = {
      id: 999,
      full_name: 'משתמש בדיקה',
      phone: '050-9999999',
      email: process.env.TEST_EMAIL || 'test@example.com',
      address: 'כתובת בדיקה 123, עיר הבדיקה',
      problem_description: 'זהו אימייל בדיקה למערכת Help Savta.',
      urgency_level: 'medium',
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      notes: 'זהו אימייל בדיקה - לא מדובר בבקשה אמיתית'
    };

    // Test request created email
    try {
      const result = await emailService.sendRequestCreatedEmail(mockRequest);
      this.addResult('Request Created Email', result,
        result ? `Email sent to ${mockRequest.email}` : 'Failed to send email');
    } catch (error) {
      this.addResult('Request Created Email', false, 'Email sending failed', error.message);
    }

    // Test email verification
    try {
      const result = await emailService.sendEmailVerification(
        mockRequest.email, 
        'test-token-123', 
        'http://localhost:3001'
      );
      this.addResult('Email Verification', result,
        result ? `Verification email sent to ${mockRequest.email}` : 'Failed to send verification email');
    } catch (error) {
      this.addResult('Email Verification', false, 'Verification email failed', error.message);
    }
  }

  /**
   * Add test result
   */
  private addResult(test: string, success: boolean, details: string, error?: string): void {
    this.results.push({ test, success, details, error });
    
    const emoji = success ? '✅' : '❌';
    console.log(`  ${emoji} ${test}: ${details}`);
    if (error) {
      console.log(`     Error: ${error}`);
    }
  }

  /**
   * Generate comprehensive test report
   */
  private generateReport(): void {
    console.log('\n📊 Test Report');
    console.log('='.repeat(50));

    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.success).length;
    const failedTests = totalTests - passedTests;
    const successRate = Math.round((passedTests / totalTests) * 100);

    console.log(`📈 Summary:`);
    console.log(`   Total Tests: ${totalTests}`);
    console.log(`   Passed: ${passedTests}`);
    console.log(`   Failed: ${failedTests}`);
    console.log(`   Success Rate: ${successRate}%`);

    // Configuration Status
    console.log(`\n⚙️  Configuration Status:`);
    console.log(`   Email Service Ready: ${emailService.isReady()}`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
    
    // Check SendGrid configuration
    const hasSendGrid = !!process.env.SENDGRID_API_KEY;
    console.log(`   SendGrid Configured: ${hasSendGrid}`);
    if (hasSendGrid) {
      console.log(`   SendGrid API Key: ${process.env.SENDGRID_API_KEY?.substring(0, 10)}...`);
    }

    // Check SMTP configuration
    const hasSmtp = !!(process.env.EMAIL_HOST && process.env.EMAIL_USER);
    console.log(`   SMTP Configured: ${hasSmtp}`);
    if (hasSmtp) {
      console.log(`   SMTP Host: ${process.env.EMAIL_HOST}`);
      console.log(`   SMTP Port: ${process.env.EMAIL_PORT}`);
    }

    console.log(`\n📧 Email Settings:`);
    console.log(`   From Email: ${process.env.EMAIL_FROM || 'Not configured'}`);
    console.log(`   From Name: ${process.env.EMAIL_FROM_NAME || 'Not configured'}`);
    console.log(`   Reply To: ${process.env.EMAIL_REPLY_TO || 'Not configured'}`);
    console.log(`   Support Email: ${process.env.SUPPORT_EMAIL || 'Not configured'}`);

    // Failed tests details
    if (failedTests > 0) {
      console.log(`\n❌ Failed Tests:`);
      this.results.filter(r => !r.success).forEach(result => {
        console.log(`   • ${result.test}: ${result.details}`);
        if (result.error) {
          console.log(`     Error: ${result.error}`);
        }
      });
    }

    // Recommendations
    console.log(`\n💡 Recommendations:`);
    if (!hasSendGrid && !hasSmtp) {
      console.log(`   • Configure either SendGrid or SMTP for email functionality`);
    }
    if (hasSendGrid && !process.env.EMAIL_FROM) {
      console.log(`   • Set EMAIL_FROM environment variable`);
    }
    if (!process.env.SUPPORT_EMAIL) {
      console.log(`   • Set SUPPORT_EMAIL environment variable`);
    }
    if (successRate === 100) {
      console.log(`   • All tests passed! Email service is ready for production.`);
    }

    console.log(`\n📅 Test completed at: ${new Date().toLocaleString('he-IL')}`);
  }
}

/**
 * Main test execution
 */
async function runEmailTests(): Promise<void> {
  const tester = new EmailServiceTester();
  
  try {
    await tester.runAllTests();
  } catch (error) {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runEmailTests().catch(error => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  });
}

export { EmailServiceTester };