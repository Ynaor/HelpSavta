#!/bin/bash

# Integration Test Script for TechHelp4U
# סקריפט בדיקת אינטגרציה עבור עזרה טכנית בהתנדבות

echo "🧪 TechHelp4U Integration Tests"
echo "בדיקות אינטגרציה - עזרה טכנית בהתנדבות"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counter
TOTAL_TESTS=0
PASSED_TESTS=0

# Function to run a test
run_test() {
    local test_name="$1"
    local command="$2"
    local expected_pattern="$3"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo -e "${BLUE}Test $TOTAL_TESTS: $test_name${NC}"
    
    # Run the command and capture output
    output=$(eval "$command" 2>&1)
    exit_code=$?
    
    # Check if command succeeded and output matches pattern
    if [ $exit_code -eq 0 ] && echo "$output" | grep -q "$expected_pattern"; then
        echo -e "${GREEN}✓ PASSED${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}✗ FAILED${NC}"
        echo "Command: $command"
        echo "Output: $output"
        echo "Expected pattern: $expected_pattern"
    fi
    echo ""
}

# Function to test API endpoint
test_api() {
    local endpoint="$1"
    local method="$2"
    local data="$3"
    local expected="$4"
    local test_name="$5"
    
    if [ "$method" = "GET" ]; then
        command="curl -s -X GET http://localhost:3001$endpoint"
    else
        command="curl -s -X $method http://localhost:3001$endpoint -H 'Content-Type: application/json' -d '$data'"
    fi
    
    run_test "$test_name" "$command" "$expected"
}

echo -e "${BLUE}Starting backend tests...${NC}"

# Test 1: Health check
test_api "/health" "GET" "" "המערכת פועלת תקין" "Health Check"

# Test 2: Get available slots
test_api "/api/slots/available" "GET" "" "success.*true" "Get Available Slots"

# Test 3: Create help request
test_api "/api/requests" "POST" '{
    "full_name": "Test User",
    "phone": "0501234567",
    "address": "Test Address 123",
    "problem_description": "Test problem description",
    "urgency_level": "medium",
    "notes": "Test notes"
}' "success.*true" "Create Help Request"

# Test 4: Admin login
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/login \
    -H "Content-Type: application/json" \
    -c test_cookies.txt \
    -d '{
        "username": "admin",
        "password": "admin123"
    }')

if echo "$LOGIN_RESPONSE" | grep -q "success.*true"; then
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    PASSED_TESTS=$((PASSED_TESTS + 1))
    echo -e "${BLUE}Test $TOTAL_TESTS: Admin Login${NC}"
    echo -e "${GREEN}✓ PASSED${NC}"
    echo ""
    
    # Test 5: Admin dashboard (requires authentication)
    run_test "Admin Dashboard" "curl -s -X GET http://localhost:3001/api/admin/dashboard -b test_cookies.txt" "success.*true"
    
    # Test 6: Get admin requests
    run_test "Get Admin Requests" "curl -s -X GET http://localhost:3001/api/admin/requests -b test_cookies.txt" "success.*true"
else
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo -e "${BLUE}Test $TOTAL_TESTS: Admin Login${NC}"
    echo -e "${RED}✗ FAILED${NC}"
    echo "Response: $LOGIN_RESPONSE"
    echo ""
fi

echo -e "${BLUE}Testing frontend availability...${NC}"

# Test 7: Frontend home page
run_test "Frontend Home Page" "curl -s http://localhost:5173" "עזרה טכנית בהתנדבות"

# Test 8: Frontend API connection
run_test "Frontend Static Files" "curl -s http://localhost:5173/vite.svg" "svg"

echo -e "${BLUE}Testing database operations...${NC}"

# Test 9: Database query
run_test "Database Query" "curl -s http://localhost:3001/api/requests" "success.*true"

# Test 10: Create multiple requests to test pagination
echo -e "${BLUE}Creating additional test data...${NC}"
for i in {1..3}; do
    curl -s -X POST http://localhost:3001/api/requests \
        -H "Content-Type: application/json" \
        -d "{
            \"full_name\": \"Test User $i\",
            \"phone\": \"050123456$i\",
            \"address\": \"Test Address $i\",
            \"problem_description\": \"Test problem $i\",
            \"urgency_level\": \"medium\",
            \"notes\": \"Test notes $i\"
        }" > /dev/null
done

# Test 11: Pagination test
run_test "Pagination Test" "curl -s 'http://localhost:3001/api/requests?limit=2&page=1'" "pagination"

echo -e "${BLUE}Testing edge cases...${NC}"

# Test 12: Invalid request data
run_test "Invalid Request Data" "curl -s -X POST http://localhost:3001/api/requests -H 'Content-Type: application/json' -d '{\"invalid\": \"data\"}'" "Validation failed"

# Test 13: Unauthorized admin access
run_test "Unauthorized Admin Access" "curl -s http://localhost:3001/api/admin/dashboard" "Unauthorized"

# Test 14: Invalid login
run_test "Invalid Login" "curl -s -X POST http://localhost:3001/api/auth/login -H 'Content-Type: application/json' -d '{\"username\": \"wrong\", \"password\": \"wrong\"}'" "Invalid credentials"

# Clean up
rm -f test_cookies.txt

echo "=============================================="
echo -e "${BLUE}Test Results Summary${NC}"
echo "=============================================="
echo -e "Total Tests: $TOTAL_TESTS"
echo -e "${GREEN}Passed: $PASSED_TESTS${NC}"
echo -e "${RED}Failed: $((TOTAL_TESTS - PASSED_TESTS))${NC}"

if [ $PASSED_TESTS -eq $TOTAL_TESTS ]; then
    echo -e "${GREEN}🎉 All tests passed! The application is working correctly.${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed. Please check the issues above.${NC}"
    exit 1
fi