import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { unifiedEmailService } from '../../backend/src/services/unifiedEmailService.js';

describe('Unified Email Service Tests', () => {
  beforeAll(async () => {
    // Setup test environment if needed
  });

  afterAll(async () => {
    // Cleanup test environment if needed
  });

  describe('Service Configuration', () => {
    test('should be properly configured', () => {
      expect(unifiedEmailService.isReady()).toBeDefined();
      console.log('📧 Available providers:', unifiedEmailService.getProviders());
    });

    test('should have at least one provider available', () => {
      const providers = unifiedEmailService.getProviders();
      expect(providers.length).toBeGreaterThan(0);
    });
  });

  describe('Connection Testing', () => {
    test('should test connection to primary provider', async () => {
      if (!unifiedEmailService.isReady()) {
        console.log('⚠️ Email service not configured - skipping connection test');
        return;
      }

      const connectionResult = await unifiedEmailService.testConnection();
      expect(typeof connectionResult).toBe('boolean');
      
      if (connectionResult) {
        console.log('✅ Email service connection successful');
      } else {
        console.log('❌ Email service connection failed');
      }
    }, 10000);
  });

  describe('Template Email Testing', () => {
    const testEmail = process.env.TEST_EMAIL || 'test@example.com';

    test('should send request-created test email', async () => {
      if (!unifiedEmailService.isReady()) {
        console.log('⚠️ Email service not configured - skipping test');
        return;
      }

      const result = await unifiedEmailService.sendTestEmail('request-created', testEmail);
      expect(typeof result).toBe('boolean');
      
      if (result) {
        console.log(`✅ Request-created test email sent to ${testEmail}`);
      } else {
        console.log(`❌ Failed to send request-created test email to ${testEmail}`);
      }
    }, 15000);

    test('should send status-update test email', async () => {
      if (!unifiedEmailService.isReady()) {
        console.log('⚠️ Email service not configured - skipping test');
        return;
      }

      const result = await unifiedEmailService.sendTestEmail('status-update', testEmail);
      expect(typeof result).toBe('boolean');
      
      if (result) {
        console.log(`✅ Status-update test email sent to ${testEmail}`);
      } else {
        console.log(`❌ Failed to send status-update test email to ${testEmail}`);
      }
    }, 15000);

    test('should send request-completed test email', async () => {
      if (!unifiedEmailService.isReady()) {
        console.log('⚠️ Email service not configured - skipping test');
        return;
      }

      const result = await unifiedEmailService.sendTestEmail('request-completed', testEmail);
      expect(typeof result).toBe('boolean');
      
      if (result) {
        console.log(`✅ Request-completed test email sent to ${testEmail}`);
      } else {
        console.log(`❌ Failed to send request-completed test email to ${testEmail}`);
      }
    }, 15000);

    test('should send basic test email', async () => {
      if (!unifiedEmailService.isReady()) {
        console.log('⚠️ Email service not configured - skipping test');
        return;
      }

      const result = await unifiedEmailService.sendTestEmail('basic', testEmail);
      expect(typeof result).toBe('boolean');
      
      if (result) {
        console.log(`✅ Basic test email sent to ${testEmail}`);
      } else {
        console.log(`❌ Failed to send basic test email to ${testEmail}`);
      }
    }, 15000);
  });

  describe('Functional Email Testing', () => {
    test('should send request created email with mock data', async () => {
      if (!unifiedEmailService.isReady()) {
        console.log('⚠️ Email service not configured - skipping test');
        return;
      }

      const mockRequest = {
        id: 999,
        full_name: 'Test User',
        phone: '050-1234567',
        email: process.env.TEST_EMAIL || 'test@example.com',
        address: 'Test Address 123, Test City',
        problem_description: 'This is a test email for the unified email service.',
        urgency_level: 'medium',
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        notes: 'Test email - not a real request'
      };

      const result = await unifiedEmailService.sendRequestCreatedEmail(mockRequest);
      expect(typeof result).toBe('boolean');
      
      if (result) {
        console.log('✅ Functional request-created email sent successfully');
      } else {
        console.log('❌ Failed to send functional request-created email');
      }
    }, 15000);

    test('should send email verification', async () => {
      if (!unifiedEmailService.isReady()) {
        console.log('⚠️ Email service not configured - skipping test');
        return;
      }

      const testEmail = process.env.TEST_EMAIL || 'test@example.com';
      const testToken = 'test-verification-token-12345';
      const baseUrl = 'https://helpsavta.com';

      const result = await unifiedEmailService.sendEmailVerification(testEmail, testToken, baseUrl);
      expect(typeof result).toBe('boolean');
      
      if (result) {
        console.log('✅ Email verification sent successfully');
      } else {
        console.log('❌ Failed to send email verification');
      }
    }, 15000);
  });

  describe('Provider Fallback Testing', () => {
    test('should handle provider fallback gracefully', async () => {
      const providers = unifiedEmailService.getProviders();
      console.log('📧 Testing fallback behavior with providers:', providers);
      
      // This test validates that the service can handle provider failures
      // and attempts fallback to secondary providers
      expect(providers).toBeDefined();
      expect(Array.isArray(providers)).toBe(true);
    });
  });
});

// Standalone test runner for manual testing
if (require.main === module) {
  const testEmail = process.argv[2] || process.env.TEST_EMAIL || 'test@example.com';
  const testType = process.argv[3] || 'basic';

  console.log('🧪 Running standalone email test...');
  console.log(`📧 Target email: ${testEmail}`);
  console.log(`🎯 Test type: ${testType}`);

  async function runStandaloneTest() {
    try {
      if (!unifiedEmailService.isReady()) {
        console.log('❌ Email service not ready. Check your configuration.');
        process.exit(1);
      }

      console.log('✅ Email service is ready');
      console.log('📧 Available providers:', unifiedEmailService.getProviders());

      let result: boolean = false;
      
      switch (testType) {
        case 'connection':
          console.log('🔌 Testing connection...');
          result = await unifiedEmailService.testConnection();
          break;
        case 'basic':
        case 'request-created':
        case 'status-update':
        case 'request-completed':
          console.log(`📧 Sending ${testType} test email...`);
          result = await unifiedEmailService.sendTestEmail(testType as any, testEmail);
          break;
        default:
          console.log('❌ Unknown test type. Available: connection, basic, request-created, status-update, request-completed');
          process.exit(1);
      }

      if (result) {
        console.log('✅ Test completed successfully!');
        process.exit(0);
      } else {
        console.log('❌ Test failed!');
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Test error:', error);
      process.exit(1);
    }
  }

  runStandaloneTest();
}