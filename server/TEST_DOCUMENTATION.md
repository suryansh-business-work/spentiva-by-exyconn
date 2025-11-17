# API Testing Documentation

## Overview
Comprehensive test suite for Quick Expense Tool backend API using Mocha, Chai, and Supertest.

## Test Infrastructure

### Dependencies Installed
- **mocha**: Test framework
- **chai**: Assertion library
- **supertest**: HTTP assertion library
- **mongodb-memory-server**: In-memory MongoDB for testing
- **nyc**: Code coverage tool
- **@types packages**: TypeScript definitions for all testing libraries

### Test Scripts
```bash
npm test              # Run all tests
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
```

### Configuration Files
- `.mocharc.json`: Mocha configuration
- `test/tsconfig.json`: TypeScript configuration for tests
- `test/helpers/`: Test utilities and fixtures

## Test Structure

### Test Helpers (`test/helpers/`)

#### database.ts
- `connectTestDB()`: Connect to in-memory MongoDB
- `disconnectTestDB()`: Disconnect from test database
- `clearTestDB()`: Clear all collections

#### fixtures.ts
- `generateTestToken(userId)`: Generate JWT token for tests
- `createTestUserData(overrides)`: Create test user data
- `createTestTrackerData(overrides)`: Create test tracker data
- `createTestExpenseData(trackerId, overrides)`: Create test expense data
- `createTestCategoryData(trackerId, overrides)`: Create test category data

#### testServer.ts
- `createTestApp()`: Create Express app instance with all routes for testing

## Test Coverage

### 1. Auth API Tests (`test/auth.test.ts`)
**26 tests total**

#### POST /api/auth/signup
- ✅ Create new user with valid data
- ✅ Return 400 if required fields missing
- ✅ Return 400 if phone already registered
- ✅ Hash password before saving

#### POST /api/auth/login
- ✅ Login with valid credentials
- ✅ Return 400 if phone/password missing
- ✅ Return 401 if user doesn't exist
- ✅ Return 401 if password incorrect

#### GET /api/auth/me
- ✅ Return user profile with valid token
- ✅ Return 401 if no token provided
- ✅ Return 403 if token invalid

### 2. Tracker API Tests (`test/tracker.test.ts`)
**15 tests total**

#### POST /api/trackers
- ✅ Create new tracker with valid data
- ✅ Return 400 if required fields missing
- ✅ Return 401 if no auth token
- ✅ Use default currency if not provided

#### GET /api/trackers
- ✅ Get all trackers for authenticated user
- ✅ Return empty array if no trackers
- ✅ Return 401 if no auth token
- ✅ Only return user's own trackers

#### GET /api/trackers/:id
- ✅ Get specific tracker by id
- ✅ Return 404 if tracker doesn't exist
- ✅ Return 404 if tracker belongs to another user

#### PUT /api/trackers/:id
- ✅ Update tracker
- ✅ Return 404 if tracker doesn't exist

#### DELETE /api/trackers/:id
- ✅ Delete tracker and associated expenses
- ✅ Return 404 if tracker doesn't exist
- ✅ Prevent deleting another user's tracker

### 3. Expense API Tests (`test/expense.test.ts`)
**14 tests total**

#### GET /api/categories
- ✅ Return categories and payment methods

#### POST /api/expenses
- ✅ Create new expense with valid data
- ✅ Return 400 if required fields missing
- ✅ Create expense without auth token (anonymous)
- ✅ Use default tracker if not provided
- ✅ Use current timestamp if not provided

#### GET /api/expenses
- ✅ Get all expenses
- ✅ Filter expenses by trackerId
- ✅ Return expenses in descending order by timestamp
- ✅ Limit results to 100 expenses

#### PUT /api/expenses/:id
- ✅ Update expense
- ✅ Return 404 if expense doesn't exist

#### DELETE /api/expenses/:id
- ✅ Delete expense
- ✅ Return 404 if expense doesn't exist

### 4. Category API Tests (`test/category.test.ts`)
**15 tests total**

#### GET /api/trackers/:trackerId/categories
- ✅ Get all categories for a tracker
- ✅ Return empty array if no categories
- ✅ Return 404 if tracker doesn't exist
- ✅ Return 401 if no auth token
- ✅ Return 404 for another user's tracker

#### POST /api/trackers/:trackerId/categories
- ✅ Create new category
- ✅ Return 400 if category name missing
- ✅ Create category with empty subcategories
- ✅ Return 404 if tracker doesn't exist
- ✅ Return 401 if no auth token

#### PUT /api/trackers/:trackerId/categories/:categoryId
- ✅ Update category
- ✅ Return 404 if category doesn't exist
- ✅ Return 404 if tracker doesn't exist
- ✅ Return 401 if no auth token

#### DELETE /api/trackers/:trackerId/categories/:categoryId
- ✅ Delete category
- ✅ Return 404 if category doesn't exist
- ✅ Return 404 if tracker doesn't exist
- ✅ Return 401 if no auth token
- ✅ Prevent deleting another user's category

### 5. Analytics API Tests (`test/analytics.test.ts`)
**16 tests total**

#### GET /api/analytics/total
- ✅ Return total expenses
- ✅ Filter total by trackerId
- ✅ Return 0 if no expenses exist

#### GET /api/analytics/summary
- ✅ Return summary statistics
- ✅ Filter summary by trackerId
- ✅ Apply date filter - today
- ✅ Apply date filter - week
- ✅ Apply date filter - month
- ✅ Return zero stats if no expenses

#### GET /api/analytics/by-category
- ✅ Return expenses grouped by category
- ✅ Filter by trackerId
- ✅ Apply date filters
- ✅ Return empty array if no expenses

#### GET /api/analytics/by-month
- ✅ Return monthly expenses breakdown
- ✅ Filter by trackerId
- ✅ Use current year if not specified

## Test Results

### Summary
```
76 passing (7s)
0 failing
```

### Coverage by API
- **Auth APIs**: 11/11 tests passing ✅
- **Tracker APIs**: 15/15 tests passing ✅
- **Expense APIs**: 14/14 tests passing ✅
- **Category APIs**: 15/15 tests passing ✅
- **Analytics APIs**: 16/16 tests passing ✅

## Key Features Tested

### Authentication & Authorization
- JWT token generation and validation
- Password hashing with bcrypt
- User registration and login
- Protected routes with authentication middleware
- User-specific data isolation

### Data Validation
- Required field validation
- Data type validation
- Business logic validation
- Error message clarity

### Database Operations
- CRUD operations for all entities
- Query filtering (by trackerId, date ranges, etc.)
- Sorting and pagination
- Cascading deletes (tracker deletion removes associated expenses/categories)

### Error Handling
- 400 Bad Request for validation errors
- 401 Unauthorized for missing/invalid tokens
- 403 Forbidden for invalid credentials
- 404 Not Found for missing resources
- 500 Internal Server Error for server issues

### Edge Cases
- Anonymous expense creation (without auth)
- Default values (currency, tracker, timestamp)
- Empty result sets
- Large data sets (100+ expenses)
- Cross-user data access prevention

## Running Tests

### Run All Tests
```bash
cd server
npm test
```

### Run Specific Test File
```bash
npm test -- test/auth.test.ts
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Generate Coverage Report
```bash
npm run test:coverage
```

## Test Database

Tests use MongoDB Memory Server for:
- Fast test execution (in-memory)
- No external dependencies
- Isolated test environment
- Automatic cleanup between tests

Each test file:
1. Connects to test DB before all tests
2. Clears DB before each test
3. Disconnects after all tests

## Best Practices

### Test Structure
- Clear test descriptions
- Arrange-Act-Assert pattern
- Independent tests (no dependencies)
- Comprehensive assertions

### Test Data
- Use fixtures for consistent test data
- Create minimal data needed per test
- Clean up after each test

### Assertions
- Test both success and failure cases
- Verify response status codes
- Check response body structure
- Validate data persistence

### Error Cases
- Test all validation rules
- Test authentication/authorization
- Test missing resources
- Test edge cases

## Future Enhancements

1. **Code Coverage**
   - Add nyc coverage reports
   - Aim for 80%+ coverage
   - Identify untested code paths

2. **Integration Tests**
   - Test complete user workflows
   - Test file upload functionality
   - Test AI expense parsing (with OpenAI mock)

3. **Performance Tests**
   - Load testing for analytics
   - Stress testing for bulk operations
   - Query optimization validation

4. **E2E Tests**
   - Frontend + Backend integration
   - User journey testing
   - Cross-browser testing

## Notes

- OpenAI API key not required for tests (graceful fallback)
- Tests run in isolated environment
- All tests are deterministic and reliable
- Fast execution (~7 seconds for 76 tests)
