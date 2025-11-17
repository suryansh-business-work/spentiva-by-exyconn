import { expect } from 'chai';
import request from 'supertest';
import { Express } from 'express';
import { connectTestDB, disconnectTestDB, clearTestDB, createTestUserData, createTestTrackerData, createTestExpenseData } from './helpers';
import { createTestApp } from './helpers/testServer';
import ExpenseModel from '../src/models/Expense';

describe('Expense API Tests', () => {
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

  describe('GET /api/categories', () => {
    it('should return categories and payment methods', async () => {
      const response = await request(app)
        .get('/api/categories')
        .expect(200);

      expect(response.body).to.have.property('categories');
      expect(response.body).to.have.property('paymentMethods');
      expect(response.body.categories).to.be.an('object');
      expect(response.body.paymentMethods).to.be.an('array');
    });
  });

  describe('POST /api/expenses', () => {
    it('should create a new expense with valid data', async () => {
      const expenseData = createTestExpenseData(trackerId);

      const response = await request(app)
        .post('/api/expenses')
        .set('Authorization', `Bearer ${authToken}`)
        .send(expenseData)
        .expect(201);

      expect(response.body).to.have.property('message', 'Expense logged successfully');
      expect(response.body.expense).to.have.property('id');
      expect(response.body.expense).to.have.property('amount', expenseData.amount);
      expect(response.body.expense).to.have.property('category', expenseData.category);
      expect(response.body.expense).to.have.property('subcategory', expenseData.subcategory);
      expect(response.body.expense).to.have.property('categoryId', expenseData.categoryId);
      expect(response.body.expense).to.have.property('paymentMethod', expenseData.paymentMethod);
      expect(response.body.expense).to.have.property('description', expenseData.description);
      expect(response.body.expense).to.have.property('trackerId', trackerId);
    });

    it('should return 400 if required fields are missing', async () => {
      const response = await request(app)
        .post('/api/expenses')
        .send({
          amount: 500,
          // Missing category, subcategory, etc.
        })
        .expect(400);

      expect(response.body).to.have.property('error', 'Missing required fields');
    });

    it('should create expense without auth token (anonymous)', async () => {
      const expenseData = createTestExpenseData(trackerId);

      const response = await request(app)
        .post('/api/expenses')
        .send(expenseData)
        .expect(201);

      expect(response.body).to.have.property('message', 'Expense logged successfully');
      expect(response.body.expense).to.have.property('id');
    });

    it('should use default tracker if not provided', async () => {
      const expenseData = createTestExpenseData();
      delete (expenseData as any).trackerId;

      const response = await request(app)
        .post('/api/expenses')
        .send(expenseData)
        .expect(201);

      expect(response.body.expense).to.have.property('trackerId', 'default');
    });

    it('should use current timestamp if not provided', async () => {
      const expenseData = createTestExpenseData(trackerId);
      delete (expenseData as any).timestamp;

      const beforeTime = new Date();
      const response = await request(app)
        .post('/api/expenses')
        .send(expenseData)
        .expect(201);
      const afterTime = new Date();

      const expenseTime = new Date(response.body.expense.timestamp);
      expect(expenseTime.getTime()).to.be.at.least(beforeTime.getTime());
      expect(expenseTime.getTime()).to.be.at.most(afterTime.getTime());
    });
  });

  describe('GET /api/expenses', () => {
    it('should get all expenses', async () => {
      // Create multiple expenses
      const expense1 = createTestExpenseData(trackerId, { amount: 100 });
      const expense2 = createTestExpenseData(trackerId, { amount: 200 });

      await request(app).post('/api/expenses').send(expense1);
      await request(app).post('/api/expenses').send(expense2);

      const response = await request(app)
        .get('/api/expenses')
        .expect(200);

      expect(response.body.expenses).to.be.an('array');
      expect(response.body.expenses).to.have.lengthOf(2);
    });

    it('should filter expenses by trackerId', async () => {
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
      await request(app).post('/api/expenses').send(createTestExpenseData(trackerId2, { amount: 300 }));

      const response = await request(app)
        .get(`/api/expenses?trackerId=${trackerId}`)
        .expect(200);

      expect(response.body.expenses).to.have.lengthOf(2);
      expect(response.body.expenses[0]).to.have.property('trackerId', trackerId);
      expect(response.body.expenses[1]).to.have.property('trackerId', trackerId);
    });

    it('should return expenses in descending order by timestamp', async () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      await request(app).post('/api/expenses').send(createTestExpenseData(trackerId, { amount: 100, timestamp: yesterday }));
      await request(app).post('/api/expenses').send(createTestExpenseData(trackerId, { amount: 200, timestamp: now }));

      const response = await request(app)
        .get('/api/expenses')
        .expect(200);

      expect(response.body.expenses[0].amount).to.equal(200); // Most recent first
      expect(response.body.expenses[1].amount).to.equal(100);
    });

    it('should limit results to 100 expenses', async () => {
      // Create 150 expenses
      const promises = [];
      for (let i = 0; i < 150; i++) {
        promises.push(request(app).post('/api/expenses').send(createTestExpenseData(trackerId, { amount: i })));
      }
      await Promise.all(promises);

      const response = await request(app)
        .get('/api/expenses')
        .expect(200);

      expect(response.body.expenses).to.have.lengthOf(100);
    });
  });

  describe('PUT /api/expenses/:id', () => {
    it('should update an expense', async () => {
      const expenseData = createTestExpenseData(trackerId);
      const createResponse = await request(app)
        .post('/api/expenses')
        .send(expenseData);

      const expenseId = createResponse.body.expense.id;

      const updateData = {
        amount: 1000,
        category: 'Transportation',
        subcategory: 'Public Transport',
        categoryId: 'transportation',
        paymentMethod: 'Credit Card',
        description: 'Updated expense',
        timestamp: new Date(),
      };

      const response = await request(app)
        .put(`/api/expenses/${expenseId}`)
        .send(updateData)
        .expect(200);

      expect(response.body).to.have.property('message', 'Expense updated successfully');
      expect(response.body.expense).to.have.property('amount', updateData.amount);
      expect(response.body.expense).to.have.property('category', updateData.category);
      expect(response.body.expense).to.have.property('subcategory', updateData.subcategory);
      expect(response.body.expense).to.have.property('paymentMethod', updateData.paymentMethod);
      expect(response.body.expense).to.have.property('description', updateData.description);
    });

    it('should return 404 if expense does not exist', async () => {
      const fakeId = '507f1f77bcf86cd799439011';

      const response = await request(app)
        .put(`/api/expenses/${fakeId}`)
        .send({ amount: 1000 })
        .expect(404);

      expect(response.body).to.have.property('error', 'Expense not found');
    });
  });

  describe('DELETE /api/expenses/:id', () => {
    it('should delete an expense', async () => {
      const expenseData = createTestExpenseData(trackerId);
      const createResponse = await request(app)
        .post('/api/expenses')
        .send(expenseData);

      const expenseId = createResponse.body.expense.id;

      const response = await request(app)
        .delete(`/api/expenses/${expenseId}`)
        .expect(200);

      expect(response.body).to.have.property('message', 'Expense deleted successfully');
      expect(response.body).to.have.property('id', expenseId);

      // Verify expense is deleted
      const expense = await ExpenseModel.findById(expenseId);
      expect(expense).to.be.null;
    });

    it('should return 404 if expense does not exist', async () => {
      const fakeId = '507f1f77bcf86cd799439011';

      const response = await request(app)
        .delete(`/api/expenses/${fakeId}`)
        .expect(404);

      expect(response.body).to.have.property('error', 'Expense not found');
    });
  });
});
