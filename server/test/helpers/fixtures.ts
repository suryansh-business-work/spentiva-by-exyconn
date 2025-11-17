import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing-only';

/**
 * Generate test JWT token
 */
export const generateTestToken = (userId: string, phone: string = '1234567890'): string => {
  return jwt.sign({ userId, phone }, JWT_SECRET, { expiresIn: '24h' });
};

/**
 * Create test user data
 */
export const createTestUserData = (overrides = {}) => {
  return {
    name: 'Test User',
    phone: '9876543210',
    password: 'TestPassword123!',
    accountType: 'individual',
    ...overrides,
  };
};

/**
 * Create test tracker data
 */
export const createTestTrackerData = (overrides = {}) => {
  return {
    name: 'Test Tracker',
    type: 'personal',
    description: 'A test tracker for expenses',
    currency: 'INR',
    ...overrides,
  };
};

/**
 * Create test expense data
 */
export const createTestExpenseData = (trackerId: string = 'default', overrides = {}) => {
  return {
    amount: 500,
    category: 'Food & Dining',
    subcategory: 'Foods',
    categoryId: 'food-dining',
    paymentMethod: 'Cash',
    description: 'Test expense',
    timestamp: new Date(),
    trackerId,
    ...overrides,
  };
};

/**
 * Create test category data
 */
export const createTestCategoryData = (trackerId: string, overrides = {}) => {
  return {
    trackerId,
    name: 'Test Category',
    subcategories: [
      { id: `${Date.now()}-1`, name: 'Subcategory 1' },
      { id: `${Date.now()}-2`, name: 'Subcategory 2' },
    ],
    ...overrides,
  };
};
