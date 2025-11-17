# API Test Suite

Comprehensive test coverage for Quick Expense Tool backend APIs.

## Quick Start

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Test Files

- `auth.test.ts` - Authentication and authorization tests (11 tests)
- `tracker.test.ts` - Tracker CRUD operations tests (15 tests)
- `expense.test.ts` - Expense management tests (14 tests)
- `category.test.ts` - Category management tests (15 tests)
- `analytics.test.ts` - Analytics and reporting tests (16 tests)

## Test Helpers

### `helpers/database.ts`
Database utilities for test setup and teardown.

### `helpers/fixtures.ts`
Test data generators for users, trackers, expenses, and categories.

### `helpers/testServer.ts`
Express app instance with all routes configured for testing.

### `helpers/index.ts`
Central export for all test helpers.

## Test Results

```
✅ 76 tests passing
⏱️  ~7 seconds execution time
🗄️  In-memory MongoDB (no external dependencies)
```

## Coverage

- **Authentication**: User signup, login, profile
- **Trackers**: Create, read, update, delete trackers
- **Expenses**: Create, read, update, delete expenses
- **Categories**: Manage tracker-specific categories
- **Analytics**: Summary stats, category breakdown, monthly reports

## Key Features

- ✅ Isolated test environment
- ✅ In-memory database (fast execution)
- ✅ Comprehensive assertions
- ✅ Error case coverage
- ✅ Authentication testing
- ✅ Authorization testing
- ✅ Data validation testing
- ✅ Edge case handling

## Writing New Tests

```typescript
import { expect } from 'chai';
import request from 'supertest';
import { Express } from 'express';
import { connectTestDB, disconnectTestDB, clearTestDB } from './helpers';
import { createTestApp } from './helpers/testServer';

describe('Your API Tests', () => {
  let app: Express;

  before(async () => {
    await connectTestDB();
    app = createTestApp();
  });

  after(async () => {
    await disconnectTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
  });

  it('should do something', async () => {
    const response = await request(app)
      .get('/api/endpoint')
      .expect(200);

    expect(response.body).to.have.property('data');
  });
});
```

## Documentation

See [TEST_DOCUMENTATION.md](../TEST_DOCUMENTATION.md) for detailed test coverage and specifications.
