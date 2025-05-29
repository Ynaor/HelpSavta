const axios = require('axios');

// Base URL for the API
const BASE_URL = 'http://localhost:3001/api';

// Test data
const TEST_ADMIN = {
  username: 'your-admin-username',
  password: 'your-admin-password'
};

// Cookie jar to maintain session
let sessionCookie = '';

async function login() {
  try {
    console.log('🔐 Testing admin login...');
    const response = await axios.post(`${BASE_URL}/auth/login`, TEST_ADMIN, {
      withCredentials: true,
      validateStatus: () => true
    });
    
    console.log('Login response status:', response.status);
    console.log('Login response data:', JSON.stringify(response.data, null, 2));
    
    // Extract session cookie
    if (response.headers['set-cookie']) {
      sessionCookie = response.headers['set-cookie'][0];
      console.log('Session cookie extracted:', sessionCookie.split(';')[0]);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('❌ Login error:', error.message);
    return false;
  }
}

async function testCalendarAPI() {
  try {
    console.log('\n📅 Testing calendar API...');
    
    // Test date range for this week
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // End of week (Saturday)
    
    const startDate = startOfWeek.toISOString().split('T')[0];
    const endDate = endOfWeek.toISOString().split('T')[0];
    
    console.log(`Testing with date range: ${startDate} to ${endDate}`);
    
    const response = await axios.get(`${BASE_URL}/admin/calendar-data`, {
      params: {
        startDate,
        endDate,
        view: 'week'
      },
      headers: {
        'Cookie': sessionCookie,
        'Content-Type': 'application/json'
      },
      withCredentials: true,
      validateStatus: () => true
    });
    
    console.log('Calendar API status:', response.status);
    console.log('Calendar API response:', JSON.stringify(response.data, null, 2));
    
    if (response.status === 200 && response.data.success) {
      console.log('✅ Calendar API test successful!');
      console.log(`📊 Events returned: ${response.data.data.events?.length || 0}`);
      console.log(`👤 User role: ${response.data.data.userRole}`);
      
      // Test with invalid date range
      console.log('\n📅 Testing invalid date range...');
      const invalidResponse = await axios.get(`${BASE_URL}/admin/calendar-data`, {
        params: {
          startDate: '2025-12-31',
          endDate: '2025-01-01', // End before start
          view: 'week'
        },
        headers: {
          'Cookie': sessionCookie,
          'Content-Type': 'application/json'
        },
        withCredentials: true,
        validateStatus: () => true
      });
      
      console.log('Invalid date range status:', invalidResponse.status);
      console.log('Invalid date range response:', JSON.stringify(invalidResponse.data, null, 2));
      
      return true;
    } else {
      console.log('❌ Calendar API test failed');
      return false;
    }
  } catch (error) {
    console.error('❌ Calendar API error:', error.message);
    if (error.response) {
      console.error('Error response:', error.response.data);
    }
    return false;
  }
}

async function testMissingParams() {
  try {
    console.log('\n📅 Testing missing parameters...');
    
    const response = await axios.get(`${BASE_URL}/admin/calendar-data`, {
      params: {
        view: 'week'
        // Missing startDate and endDate
      },
      headers: {
        'Cookie': sessionCookie,
        'Content-Type': 'application/json'
      },
      withCredentials: true,
      validateStatus: () => true
    });
    
    console.log('Missing params status:', response.status);
    console.log('Missing params response:', JSON.stringify(response.data, null, 2));
    
    return response.status === 400;
  } catch (error) {
    console.error('❌ Missing params test error:', error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Starting Calendar API Tests\n');
  
  // Test login
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log('❌ Cannot proceed without successful login');
    return;
  }
  
  // Test calendar API
  await testCalendarAPI();
  
  // Test validation
  await testMissingParams();
  
  console.log('\n✅ All tests completed!');
}

// Run tests
runAllTests().catch(console.error);