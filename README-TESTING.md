# E-commerce API Testing Guide

This guide explains how to test your MERN e-commerce application's API endpoints and ensure full functionality.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Run All Tests
```bash
npm test
```

### 3. Run Specific Test Types
```bash
# API endpoint tests only
npm run test:api

# End-to-end flow tests only
npm run test:e2e

# Tests with coverage report
npm run test:coverage

# Watch mode for development
npm run test:watch
```

### 4. Use the Test Runner
```bash
# Run all tests with detailed report
node test-runner.js

# Run specific test types
node test-runner.js api
node test-runner.js e2e
node test-runner.js coverage
```

## 📋 Test Coverage

### API Endpoint Tests (`tests/api/`)

#### Authentication (`auth.test.js`)
- ✅ User registration
- ✅ User login/logout
- ✅ Profile management
- ✅ JWT token validation
- ✅ Password validation
- ✅ Duplicate email handling

#### Products (`products.test.js`)
- ✅ Product CRUD operations
- ✅ Product search and filtering
- ✅ Category management
- ✅ Pagination
- ✅ Admin authorization
- ✅ Stock management

#### Orders (`orders.test.js`)
- ✅ Order creation
- ✅ Order status management
- ✅ Order history
- ✅ Order cancellation
- ✅ Admin order management
- ✅ User order access control

#### Payments (`payments.test.js`)
- ✅ Payment processing
- ✅ Payment verification
- ✅ Refund processing
- ✅ Payment history
- ✅ Payment status tracking

### End-to-End Tests (`tests/e2e/`)

#### Full User Journey (`full-flow.test.js`)
- ✅ Complete e-commerce flow
- ✅ User registration → Login → Browse → Order → Pay
- ✅ Product search and filtering
- ✅ Order management workflow
- ✅ Payment processing flow

## 🔧 Test Configuration

### Environment Setup
The tests use MongoDB Memory Server for isolated testing:
- No external database required
- Tests run in isolation
- Automatic cleanup between tests

### Test Utilities
Global test utilities are available in `tests/setup.js`:
- `testUtils.createTestUser()` - Create test user data
- `testUtils.createTestProduct()` - Create test product data
- `testUtils.createTestOrder()` - Create test order data

## 📊 Test Reports

### Coverage Report
Run `npm run test:coverage` to generate a coverage report showing:
- Line coverage
- Branch coverage
- Function coverage
- Statement coverage

### Test Results
Test results are saved to `test-report.json` with:
- Pass/fail status
- Execution time
- Error details
- Summary statistics

## 🧪 Manual API Testing

### Using Postman or Similar Tools

#### 1. Authentication Endpoints
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "Test User",
  "email": "test@example.com",
  "password": "password123",
  "phone": "1234567890"
}
```

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "password123"
}
```

#### 2. Product Endpoints
```http
GET /api/products
GET /api/products?category=Electronics&search=phone&page=1&limit=10
GET /api/products/:id
```

#### 3. Order Endpoints
```http
POST /api/orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "products": [
    {
      "product": "product_id",
      "quantity": 2,
      "price": 99.99
    }
  ],
  "shippingAddress": {
    "address": "123 Test St",
    "city": "Test City",
    "state": "Test State",
    "country": "Test Country",
    "zipCode": "12345"
  },
  "paymentMethod": "card",
  "totalAmount": 199.98
}
```

#### 4. Payment Endpoints
```http
POST /api/payments/process
Authorization: Bearer <token>
Content-Type: application/json

{
  "orderId": "order_id",
  "paymentMethod": "card",
  "amount": 199.98,
  "currency": "usd",
  "paymentIntentId": "pi_test_123456789"
}
```

## 🔍 Debugging Tests

### Common Issues

1. **MongoDB Connection Issues**
   - Ensure MongoDB Memory Server is working
   - Check if port conflicts exist

2. **JWT Token Issues**
   - Verify JWT_SECRET is set in environment
   - Check token expiration times

3. **Test Timeout Issues**
   - Increase timeout in Jest configuration
   - Check for hanging database connections

### Debug Mode
Run tests in debug mode:
```bash
# Debug specific test file
npm test -- --verbose tests/api/auth.test.js

# Debug with console output
npm test -- --verbose --detectOpenHandles
```

## 📈 Continuous Integration

### GitHub Actions Example
```yaml
name: API Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '16'
      - run: npm install
      - run: npm test
      - run: npm run test:coverage
```

## 🎯 Best Practices

1. **Test Isolation**: Each test should be independent
2. **Clean Data**: Use beforeEach/afterEach for cleanup
3. **Meaningful Names**: Use descriptive test names
4. **Edge Cases**: Test error conditions and edge cases
5. **Realistic Data**: Use realistic test data
6. **Fast Execution**: Keep tests fast and efficient

## 🚨 Troubleshooting

### Test Failures
1. Check MongoDB connection
2. Verify environment variables
3. Ensure all dependencies are installed
4. Check for port conflicts

### Performance Issues
1. Use MongoDB Memory Server
2. Implement proper cleanup
3. Avoid unnecessary database operations
4. Use efficient test data setup

## 📞 Support

If you encounter issues:
1. Check the test logs for detailed error messages
2. Verify your API endpoints match the test expectations
3. Ensure your models and routes are properly implemented
4. Check the test setup configuration

## 🎉 Success Criteria

Your API is fully tested when:
- ✅ All API endpoint tests pass
- ✅ All E2E flow tests pass
- ✅ Coverage is above 80%
- ✅ No critical security vulnerabilities
- ✅ All business logic is covered
- ✅ Error handling is tested
- ✅ Authentication and authorization work correctly



