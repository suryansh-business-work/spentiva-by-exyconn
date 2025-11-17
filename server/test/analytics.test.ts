import { expect } from 'chai';
import request from 'supertest';
import { Express } from 'express';
import { connectTestDB, disconnectTestDB, clearTestDB, createTestUserData, createTestTrackerData, createTestExpenseData } from './helpers';
import { createTestApp } from './helpers/testServer';

describe('Analytics API Tests', () => {
  let app: Express;
  let authToken: string;
  let userId: string;
  let trackerId: string;

  before(async () => {
    await connectTestDB();
    app = createTestApp();
  });

  after(async () => {
    await disconnectTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();

    // Create a test user
    const userData = createTestUserData();
    const userResponse = await request(app)
      .post('/api/auth/signup')
      .send(userData);

    authToken = userResponse.body.token;
    userId = userResponse.body.user.id;

    // Create a test tracker
    const trackerData = createTestTrackerData();
    const trackerResponse = await request(app)
      .post('/api/trackers')
      .set('Authorization', `Bearer ${authToken}`)
      .send(trackerData);

    trackerId = trackerResponse.body.tracker.id;
  });

  describe('GET /api/analytics/total', () => {
    it('should return total expenses', async () => {
      // Create multiple expenses
      await request(app).post('/api/expenses').send(createTestExpenseData(trackerId, { amount: 100 }));
      await request(app).post('/api/expenses').send(createTestExpenseData(trackerId, { amount: 200 }));
      await request(app).post('/api/expenses').send(createTestExpenseData(trackerId, { amount: 300 }));

      const response = await request(app)
        .get('/api/analytics/total')
        .expect(200);

      expect(response.body).to.have.property('total', 600);
    });

    it('should filter total by trackerId', async () => {
      // Create second tracker
      const tracker2Data = createTestTrackerData({ name: 'Tracker 2' });
      const tracker2Response = await request(app)
        .post('/api/trackers')
        .set('Authorization', `Bearer ${authToken}`)
        .send(tracker2Data);

      const trackerId2 = tracker2Response.body.tracker.id;

      // Create expenses for different trackers
      await request(app).post('/api/expenses').send(createTestExpenseData(trackerId, { amount: 100 }));
      await request(app).post('/api/expenses').send(createTestExpenseData(trackerId, { amount: 200 }));
      await request(app).post('/api/expenses').send(createTestExpenseData(trackerId2, { amount: 500 }));

      const response = await request(app)
        .get(`/api/analytics/total?trackerId=${trackerId}`)
        .expect(200);

      expect(response.body).to.have.property('total', 300);
    });

    it('should return 0 if no expenses exist', async () => {
      const response = await request(app)
        .get('/api/analytics/total')
        .expect(200);

      expect(response.body).to.have.property('total', 0);
    });
  });

  describe('GET /api/analytics/summary', () => {
    it('should return summary statistics', async () => {
      // Create multiple expenses
      await request(app).post('/api/expenses').send(createTestExpenseData(trackerId, { amount: 100 }));
      await request(app).post('/api/expenses').send(createTestExpenseData(trackerId, { amount: 200 }));
      await request(app).post('/api/expenses').send(createTestExpenseData(trackerId, { amount: 300 }));

      const response = await request(app)
        .get('/api/analytics/summary')
        .expect(200);

      expect(response.body).to.have.property('stats');
      expect(response.body.stats).to.have.property('total', 600);
      expect(response.body.stats).to.have.property('average', 200);
      expect(response.body.stats).to.have.property('count', 3);
      expect(response.body).to.have.property('filter', 'all');
      expect(response.body).to.have.property('dateRange');
    });

    it('should filter summary by trackerId', async () => {
      // Create second tracker
      const tracker2Data = createTestTrackerData({ name: 'Tracker 2' });
      const tracker2Response = await request(app)
        .post('/api/trackers')
        .set('Authorization', `Bearer ${authToken}`)
        .send(tracker2Data);

      const trackerId2 = tracker2Response.body.tracker.id;

      // Create expenses for different trackers
      await request(app).post('/api/expenses').send(createTestExpenseData(trackerId, { amount: 100 }));
      await request(app).post('/api/expenses').send(createTestExpenseData(trackerId, { amount: 200 }));
      await request(app).post('/api/expenses').send(createTestExpenseData(trackerId2, { amount: 500 }));

      const response = await request(app)
        .get(`/api/analytics/summary?trackerId=${trackerId}`)
        .expect(200);

      expect(response.body.stats).to.have.property('total', 300);
      expect(response.body.stats).to.have.property('average', 150);
      expect(response.body.stats).to.have.property('count', 2);
    });

    it('should apply date filter - today', async () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // Create expenses for today and yesterday
      await request(app).post('/api/expenses').send(createTestExpenseData(trackerId, { amount: 100, timestamp: now }));
      await request(app).post('/api/expenses').send(createTestExpenseData(trackerId, { amount: 200, timestamp: yesterday }));

      const response = await request(app)
        .get('/api/analytics/summary?filter=today')
        .expect(200);

      expect(response.body).to.have.property('filter', 'today');
      expect(response.body.stats.count).to.be.at.least(1); // Should include today's expenses
    });

    it('should apply date filter - week', async () => {
      const now = new Date();
      const lastWeek = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000);

      // Create expenses for this week and last week
      await request(app).post('/api/expenses').send(createTestExpenseData(trackerId, { amount: 100, timestamp: now }));
      await request(app).post('/api/expenses').send(createTestExpenseData(trackerId, { amount: 200, timestamp: lastWeek }));

      const response = await request(app)
        .get('/api/analytics/summary?filter=week')
        .expect(200);

      expect(response.body).to.have.property('filter', 'week');
    });

    it('should apply date filter - month', async () => {
      const now = new Date();
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

      // Create expenses for this month and last month
      await request(app).post('/api/expenses').send(createTestExpenseData(trackerId, { amount: 100, timestamp: now }));
      await request(app).post('/api/expenses').send(createTestExpenseData(trackerId, { amount: 200, timestamp: lastMonth }));

      const response = await request(app)
        .get('/api/analytics/summary?filter=month')
        .expect(200);

      expect(response.body).to.have.property('filter', 'month');
    });

    it('should return zero stats if no expenses exist', async () => {
      const response = await request(app)
        .get('/api/analytics/summary')
        .expect(200);

      expect(response.body.stats).to.have.property('total', 0);
      expect(response.body.stats).to.have.property('average', 0);
      expect(response.body.stats).to.have.property('count', 0);
    });
  });

  describe('GET /api/analytics/by-category', () => {
    it('should return expenses grouped by category', async () => {
      // Create expenses with different categories
      await request(app).post('/api/expenses').send(createTestExpenseData(trackerId, {
        amount: 100,
        category: 'Food & Dining',
        categoryId: 'food-dining',
      }));
      await request(app).post('/api/expenses').send(createTestExpenseData(trackerId, {
        amount: 200,
        category: 'Food & Dining',
        categoryId: 'food-dining',
      }));
      await request(app).post('/api/expenses').send(createTestExpenseData(trackerId, {
        amount: 300,
        category: 'Transportation',
        categoryId: 'transportation',
      }));

      const response = await request(app)
        .get('/api/analytics/by-category')
        .expect(200);

      expect(response.body).to.have.property('data');
      expect(response.body.data).to.be.an('array');
      expect(response.body.data).to.have.lengthOf(2);

      // Sorted by total descending
      expect(response.body.data[0]).to.have.property('category', 'Food & Dining');
      expect(response.body.data[0]).to.have.property('total', 300);
      expect(response.body.data[0]).to.have.property('count', 2);

      expect(response.body.data[1]).to.have.property('category', 'Transportation');
      expect(response.body.data[1]).to.have.property('total', 300);
      expect(response.body.data[1]).to.have.property('count', 1);
    });

    it('should filter by trackerId', async () => {
      // Create second tracker
      const tracker2Data = createTestTrackerData({ name: 'Tracker 2' });
      const tracker2Response = await request(app)
        .post('/api/trackers')
        .set('Authorization', `Bearer ${authToken}`)
        .send(tracker2Data);

      const trackerId2 = tracker2Response.body.tracker.id;

      // Create expenses for different trackers
      await request(app).post('/api/expenses').send(createTestExpenseData(trackerId, {
        amount: 100,
        category: 'Food & Dining',
        categoryId: 'food-dining',
      }));
      await request(app).post('/api/expenses').send(createTestExpenseData(trackerId2, {
        amount: 500,
        category: 'Transportation',
        categoryId: 'transportation',
      }));

      const response = await request(app)
        .get(`/api/analytics/by-category?trackerId=${trackerId}`)
        .expect(200);

      expect(response.body.data).to.have.lengthOf(1);
      expect(response.body.data[0]).to.have.property('category', 'Food & Dining');
    });

    it('should apply date filters', async () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      await request(app).post('/api/expenses').send(createTestExpenseData(trackerId, {
        amount: 100,
        category: 'Food & Dining',
        categoryId: 'food-dining',
        timestamp: now,
      }));
      await request(app).post('/api/expenses').send(createTestExpenseData(trackerId, {
        amount: 200,
        category: 'Transportation',
        categoryId: 'transportation',
        timestamp: yesterday,
      }));

      const response = await request(app)
        .get('/api/analytics/by-category?filter=today')
        .expect(200);

      expect(response.body).to.have.property('filter', 'today');
      expect(response.body).to.have.property('data');
    });

    it('should return empty array if no expenses exist', async () => {
      const response = await request(app)
        .get('/api/analytics/by-category')
        .expect(200);

      expect(response.body.data).to.be.an('array').that.is.empty;
    });
  });

  describe('GET /api/analytics/by-month', () => {
    it('should return monthly expenses breakdown', async () => {
      const now = new Date();
      const year = now.getFullYear();

      // Create expenses for different months
      await request(app).post('/api/expenses').send(createTestExpenseData(trackerId, {
        amount: 100,
        timestamp: new Date(year, 0, 15), // January
      }));
      await request(app).post('/api/expenses').send(createTestExpenseData(trackerId, {
        amount: 200,
        timestamp: new Date(year, 1, 15), // February
      }));
      await request(app).post('/api/expenses').send(createTestExpenseData(trackerId, {
        amount: 300,
        timestamp: new Date(year, 1, 20), // February
      }));

      const response = await request(app)
        .get(`/api/analytics/by-month?year=${year}`)
        .expect(200);

      expect(response.body).to.have.property('data');
      expect(response.body).to.have.property('year', year);
      expect(response.body.data).to.be.an('array');
    });

    it('should filter by trackerId', async () => {
      const now = new Date();
      const year = now.getFullYear();

      // Create second tracker
      const tracker2Data = createTestTrackerData({ name: 'Tracker 2' });
      const tracker2Response = await request(app)
        .post('/api/trackers')
        .set('Authorization', `Bearer ${authToken}`)
        .send(tracker2Data);

      const trackerId2 = tracker2Response.body.tracker.id;

      // Create expenses for different trackers
      await request(app).post('/api/expenses').send(createTestExpenseData(trackerId, {
        amount: 100,
        timestamp: new Date(year, 0, 15),
      }));
      await request(app).post('/api/expenses').send(createTestExpenseData(trackerId2, {
        amount: 500,
        timestamp: new Date(year, 0, 15),
      }));

      const response = await request(app)
        .get(`/api/analytics/by-month?year=${year}&trackerId=${trackerId}`)
        .expect(200);

      expect(response.body).to.have.property('data');
      expect(response.body).to.have.property('year', year);
    });

    it('should use current year if year not specified', async () => {
      const currentYear = new Date().getFullYear();

      const response = await request(app)
        .get('/api/analytics/by-month')
        .expect(200);

      expect(response.body).to.have.property('year', currentYear);
    });
  });
});
