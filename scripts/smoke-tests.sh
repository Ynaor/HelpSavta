#!/bin/bash

# Smoke Tests Script for HelpSavta Application
# Usage: ./scripts/smoke-tests.sh [base_url]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BASE_URL=${1:-"http://localhost:3000"}
TIMEOUT=30
MAX_RETRIES=3
RETRY_DELAY=5

echo -e "${BLUE}=== HelpSavta Smoke Tests ===${NC}"
echo -e "Target URL: ${YELLOW}${BASE_URL}${NC}"
echo -e "Timeout: ${YELLOW}${TIMEOUT}s${NC}"
echo ""

# Function to log with timestamp
log() {
    echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Function to test HTTP endpoint
test_endpoint() {
    local endpoint="$1"
    local expected_status="$2"
    local description="$3"
    local method="${4:-GET}"
    local data="${5:-}"
    
    local url="${BASE_URL}${endpoint}"
    local retry=0
    
    log "${BLUE}Testing: ${description}${NC}"
    log "URL: ${url}"
    
    while [[ $retry -lt $MAX_RETRIES ]]; do
        local response
        local status
        
        if [[ "$method" == "POST" && -n "$data" ]]; then
            response=$(curl -s -w "\n%{http_code}" \
                --connect-timeout $TIMEOUT \
                --max-time $TIMEOUT \
                -X POST \
                -H "Content-Type: application/json" \
                -d "$data" \
                "$url" 2>/dev/null || echo -e "\n000")
        else
            response=$(curl -s -w "\n%{http_code}" \
                --connect-timeout $TIMEOUT \
                --max-time $TIMEOUT \
                "$url" 2>/dev/null || echo -e "\n000")
        fi
        
        status=$(echo "$response" | tail -n1)
        body=$(echo "$response" | head -n -1)
        
        if [[ "$status" == "$expected_status" ]]; then
            log "${GREEN}✓ ${description} - Status: ${status}${NC}"
            if [[ -n "$body" && "$body" != "000" ]]; then
                log "Response preview: $(echo "$body" | head -c 100)..."
            fi
            return 0
        else
            retry=$((retry + 1))
            log "${YELLOW}⚠ Attempt ${retry}/${MAX_RETRIES} failed - Status: ${status}${NC}"
            
            if [[ $retry -lt $MAX_RETRIES ]]; then
                log "Retrying in ${RETRY_DELAY} seconds..."
                sleep $RETRY_DELAY
            fi
        fi
    done
    
    log "${RED}✗ ${description} - Failed after ${MAX_RETRIES} attempts${NC}"
    log "Final status: ${status}"
    if [[ -n "$body" && "$body" != "000" ]]; then
        log "Response: $body"
    fi
    return 1
}

# Function to test JSON response
test_json_endpoint() {
    local endpoint="$1"
    local description="$2"
    local expected_field="$3"
    
    local url="${BASE_URL}${endpoint}"
    
    log "${BLUE}Testing JSON: ${description}${NC}"
    log "URL: ${url}"
    
    local response=$(curl -s \
        --connect-timeout $TIMEOUT \
        --max-time $TIMEOUT \
        -H "Accept: application/json" \
        "$url" 2>/dev/null || echo "{}")
    
    if command -v jq &> /dev/null; then
        local is_valid_json=$(echo "$response" | jq -e . >/dev/null 2>&1 && echo "true" || echo "false")
        
        if [[ "$is_valid_json" == "true" ]]; then
            if [[ -n "$expected_field" ]]; then
                local field_exists=$(echo "$response" | jq -e ".$expected_field" >/dev/null 2>&1 && echo "true" || echo "false")
                
                if [[ "$field_exists" == "true" ]]; then
                    log "${GREEN}✓ ${description} - Valid JSON with expected field${NC}"
                    return 0
                else
                    log "${RED}✗ ${description} - Missing expected field: ${expected_field}${NC}"
                    return 1
                fi
            else
                log "${GREEN}✓ ${description} - Valid JSON response${NC}"
                return 0
            fi
        else
            log "${RED}✗ ${description} - Invalid JSON response${NC}"
            log "Response: $response"
            return 1
        fi
    else
        # Basic JSON validation without jq
        if [[ "$response" =~ ^\{.*\}$ ]] || [[ "$response" =~ ^\[.*\]$ ]]; then
            log "${GREEN}✓ ${description} - JSON-like response${NC}"
            return 0
        else
            log "${RED}✗ ${description} - Not a JSON response${NC}"
            log "Response: $response"
            return 1
        fi
    fi
}

# Test results tracking
TESTS_PASSED=0
TESTS_FAILED=0
FAILED_TESTS=()

# Function to run test and track results
run_test() {
    if "$@"; then
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        TESTS_FAILED=$((TESTS_FAILED + 1))
        FAILED_TESTS+=("$2")
    fi
    echo ""
}

# Start smoke tests
log "${BLUE}Starting smoke tests...${NC}"
echo ""

# Basic health checks
run_test test_endpoint "/health" "200" "Health check endpoint"
run_test test_endpoint "/api/health" "200" "API health check"

# API endpoints
run_test test_endpoint "/api/slots" "200" "Get available slots"
run_test test_endpoint "/api/requests" "200" "Get help requests"

# JSON API tests
run_test test_json_endpoint "/api/health" "API health JSON response" "status"
run_test test_json_endpoint "/api/slots" "Slots API JSON response"

# Frontend static files (if serving from same domain)
run_test test_endpoint "/" "200" "Frontend home page"
run_test test_endpoint "/static/css" "200" "CSS static files" || \
run_test test_endpoint "/assets" "200" "Frontend assets" || \
log "${YELLOW}Note: Static files may be served from CDN${NC}"

# Authentication endpoints
run_test test_endpoint "/api/auth/admin/login" "200" "Admin login page"

# Test POST endpoints (without authentication - should return 401 or validation error)
run_test test_endpoint "/api/requests" "400" "Create request validation" "POST" '{"invalid": "data"}'
run_test test_endpoint "/api/auth/admin/login" "400" "Admin login validation" "POST" '{"username": "", "password": ""}'

# Database connectivity test
run_test test_json_endpoint "/api/health/db" "Database connectivity" "database" || \
log "${YELLOW}Note: Database health endpoint may not be implemented${NC}"

# Performance test - response time
log "${BLUE}Testing response time...${NC}"
START_TIME=$(date +%s%N)
test_endpoint "/api/health" "200" "Response time test" >/dev/null 2>&1
END_TIME=$(date +%s%N)
RESPONSE_TIME=$(( (END_TIME - START_TIME) / 1000000 ))

if [[ $RESPONSE_TIME -lt 2000 ]]; then
    log "${GREEN}✓ Response time: ${RESPONSE_TIME}ms (Good)${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
elif [[ $RESPONSE_TIME -lt 5000 ]]; then
    log "${YELLOW}⚠ Response time: ${RESPONSE_TIME}ms (Acceptable)${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    log "${RED}✗ Response time: ${RESPONSE_TIME}ms (Too slow)${NC}"
    TESTS_FAILED=$((TESTS_FAILED + 1))
    FAILED_TESTS+=("Response time test")
fi
echo ""

# Security headers test
log "${BLUE}Testing security headers...${NC}"
SECURITY_RESPONSE=$(curl -s -I \
    --connect-timeout $TIMEOUT \
    --max-time $TIMEOUT \
    "$BASE_URL/" 2>/dev/null || echo "")

SECURITY_PASSED=0
SECURITY_TOTAL=4

if echo "$SECURITY_RESPONSE" | grep -qi "x-frame-options"; then
    log "${GREEN}✓ X-Frame-Options header present${NC}"
    SECURITY_PASSED=$((SECURITY_PASSED + 1))
else
    log "${YELLOW}⚠ X-Frame-Options header missing${NC}"
fi

if echo "$SECURITY_RESPONSE" | grep -qi "x-content-type-options"; then
    log "${GREEN}✓ X-Content-Type-Options header present${NC}"
    SECURITY_PASSED=$((SECURITY_PASSED + 1))
else
    log "${YELLOW}⚠ X-Content-Type-Options header missing${NC}"
fi

if echo "$SECURITY_RESPONSE" | grep -qi "strict-transport-security"; then
    log "${GREEN}✓ Strict-Transport-Security header present${NC}"
    SECURITY_PASSED=$((SECURITY_PASSED + 1))
else
    log "${YELLOW}⚠ Strict-Transport-Security header missing${NC}"
fi

if echo "$SECURITY_RESPONSE" | grep -qi "content-security-policy"; then
    log "${GREEN}✓ Content-Security-Policy header present${NC}"
    SECURITY_PASSED=$((SECURITY_PASSED + 1))
else
    log "${YELLOW}⚠ Content-Security-Policy header missing${NC}"
fi

if [[ $SECURITY_PASSED -ge 2 ]]; then
    log "${GREEN}✓ Security headers test passed (${SECURITY_PASSED}/${SECURITY_TOTAL})${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    log "${RED}✗ Security headers test failed (${SECURITY_PASSED}/${SECURITY_TOTAL})${NC}"
    TESTS_FAILED=$((TESTS_FAILED + 1))
    FAILED_TESTS+=("Security headers test")
fi
echo ""

# SSL/TLS test (if HTTPS)
if [[ "$BASE_URL" =~ ^https:// ]]; then
    log "${BLUE}Testing SSL/TLS configuration...${NC}"
    
    SSL_RESPONSE=$(curl -s -I \
        --connect-timeout $TIMEOUT \
        --max-time $TIMEOUT \
        "$BASE_URL/" 2>/dev/null || echo "")
    
    if [[ -n "$SSL_RESPONSE" ]]; then
        log "${GREEN}✓ HTTPS connection successful${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        log "${RED}✗ HTTPS connection failed${NC}"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        FAILED_TESTS+=("HTTPS connection test")
    fi
    echo ""
fi

# Results summary
log "${BLUE}=== Smoke Tests Summary ===${NC}"
log "Tests passed: ${GREEN}${TESTS_PASSED}${NC}"
log "Tests failed: ${RED}${TESTS_FAILED}${NC}"
log "Total tests: $((TESTS_PASSED + TESTS_FAILED))"

if [[ $TESTS_FAILED -gt 0 ]]; then
    echo ""
    log "${RED}Failed tests:${NC}"
    for test in "${FAILED_TESTS[@]}"; do
        log "  - $test"
    done
    echo ""
    log "${RED}Some smoke tests failed. Please investigate before proceeding.${NC}"
    exit 1
else
    echo ""
    log "${GREEN}All smoke tests passed! Application appears to be healthy.${NC}"
    exit 0
fi