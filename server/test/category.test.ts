import { expect } from 'chai';
import request from 'supertest';
import { Express } from 'express';
import { connectTestDB, disconnectTestDB, clearTestDB, createTestUserData, createTestTrackerData, createTestCategoryData } from './helpers';
import { createTestApp } from './helpers/testServer';
import CategoryModel from '../src/models/Category';

describe('Category API Tests', () => {
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

  describe('GET /api/trackers/:trackerId/categories', () => {
    it('should get all categories for a tracker', async () => {
      // Create multiple categories
      await request(app)
        .post(`/api/trackers/${trackerId}/categories`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(createTestCategoryData(trackerId, { name: 'Category 1' }));

      await request(app)
        .post(`/api/trackers/${trackerId}/categories`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(createTestCategoryData(trackerId, { name: 'Category 2' }));

      const response = await request(app)
        .get(`/api/trackers/${trackerId}/categories`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.categories).to.be.an('array');
      expect(response.body.categories).to.have.lengthOf(2);
      expect(response.body.categories[0]).to.have.property('name', 'Category 1');
      expect(response.body.categories[1]).to.have.property('name', 'Category 2');
    });

    it('should return empty array if tracker has no categories', async () => {
      const response = await request(app)
        .get(`/api/trackers/${trackerId}/categories`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.categories).to.be.an('array');
      expect(response.body.categories).to.have.lengthOf(0);
    });

    it('should return 404 if tracker does not exist', async () => {
      const fakeId = '507f1f77bcf86cd799439011';

      const response = await request(app)
        .get(`/api/trackers/${fakeId}/categories`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).to.have.property('error', 'Tracker not found');
    });

    it('should return 401 if no auth token is provided', async () => {
      const response = await request(app)
        .get(`/api/trackers/${trackerId}/categories`)
        .expect(401);

      expect(response.body).to.have.property('error', 'Access token is required');
    });

    it('should return 404 if trying to access another user\'s tracker', async () => {
      // Create second user
      const user2Data = createTestUserData({ phone: '9999999999' });
      const user2Response = await request(app)
        .post('/api/auth/signup')
        .send(user2Data);

      const user2Token = user2Response.body.token;

      const response = await request(app)
        .get(`/api/trackers/${trackerId}/categories`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(404);

      expect(response.body).to.have.property('error', 'Tracker not found');
    });
  });

  describe('POST /api/trackers/:trackerId/categories', () => {
    it('should create a new category', async () => {
      const categoryData = createTestCategoryData(trackerId);

      const response = await request(app)
        .post(`/api/trackers/${trackerId}/categories`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(categoryData)
        .expect(201);

      expect(response.body).to.have.property('message', 'Category created successfully');
      expect(response.body.category).to.have.property('id');
      expect(response.body.category).to.have.property('name', categoryData.name);
      expect(response.body.category).to.have.property('trackerId', trackerId);
      expect(response.body.category).to.have.property('subcategories');
      expect(response.body.category.subcategories).to.be.an('array');
      expect(response.body.category.subcategories).to.have.lengthOf(2);
      expect(response.body.category.subcategories[0]).to.have.property('name', 'Subcategory 1');
      expect(response.body.category.subcategories[1]).to.have.property('name', 'Subcategory 2');
    });

    it('should return 400 if category name is missing', async () => {
      const response = await request(app)
        .post(`/api/trackers/${trackerId}/categories`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          subcategories: ['Sub 1', 'Sub 2'],
        })
        .expect(400);

      expect(response.body).to.have.property('error', 'Category name is required');
    });

    it('should create category with empty subcategories if not provided', async () => {
      const response = await request(app)
        .post(`/api/trackers/${trackerId}/categories`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Category',
        })
        .expect(201);

      expect(response.body.category).to.have.property('subcategories');
      expect(response.body.category.subcategories).to.be.an('array').that.is.empty;
    });

    it('should return 404 if tracker does not exist', async () => {
      const fakeId = '507f1f77bcf86cd799439011';

      const response = await request(app)
        .post(`/api/trackers/${fakeId}/categories`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(createTestCategoryData(fakeId))
        .expect(404);

      expect(response.body).to.have.property('error', 'Tracker not found');
    });

    it('should return 401 if no auth token is provided', async () => {
      const response = await request(app)
        .post(`/api/trackers/${trackerId}/categories`)
        .send(createTestCategoryData(trackerId))
        .expect(401);

      expect(response.body).to.have.property('error', 'Access token is required');
    });
  });

  describe('PUT /api/trackers/:trackerId/categories/:categoryId', () => {
    it('should update a category', async () => {
      const categoryData = createTestCategoryData(trackerId);
      const createResponse = await request(app)
        .post(`/api/trackers/${trackerId}/categories`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(categoryData);

      const categoryId = createResponse.body.category.id;

      const updateData = {
        name: 'Updated Category Name',
        subcategories: [
          { id: `${Date.now()}-1`, name: 'New Sub 1' },
          { id: `${Date.now()}-2`, name: 'New Sub 2' },
          { id: `${Date.now()}-3`, name: 'New Sub 3' },
        ],
      };

      const response = await request(app)
        .put(`/api/trackers/${trackerId}/categories/${categoryId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).to.have.property('message', 'Category updated successfully');
      expect(response.body.category).to.have.property('name', updateData.name);
      expect(response.body.category.subcategories).to.have.lengthOf(3);
      expect(response.body.category.subcategories[0]).to.have.property('name', 'New Sub 1');
    });

    it('should return 404 if category does not exist', async () => {
      const fakeId = '507f1f77bcf86cd799439011';

      const response = await request(app)
        .put(`/api/trackers/${trackerId}/categories/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated Name' })
        .expect(404);

      expect(response.body).to.have.property('error', 'Category not found');
    });

    it('should return 404 if tracker does not exist', async () => {
      const fakeTrackerId = '507f1f77bcf86cd799439011';
      const fakeCategoryId = '507f1f77bcf86cd799439012';

      const response = await request(app)
        .put(`/api/trackers/${fakeTrackerId}/categories/${fakeCategoryId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated Name' })
        .expect(404);

      expect(response.body).to.have.property('error', 'Tracker not found');
    });

    it('should return 401 if no auth token is provided', async () => {
      const fakeCategoryId = '507f1f77bcf86cd799439011';

      const response = await request(app)
        .put(`/api/trackers/${trackerId}/categories/${fakeCategoryId}`)
        .send({ name: 'Updated Name' })
        .expect(401);

      expect(response.body).to.have.property('error', 'Access token is required');
    });
  });

  describe('DELETE /api/trackers/:trackerId/categories/:categoryId', () => {
    it('should delete a category', async () => {
      const categoryData = createTestCategoryData(trackerId);
      const createResponse = await request(app)
        .post(`/api/trackers/${trackerId}/categories`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(categoryData);

      const categoryId = createResponse.body.category.id;

      const response = await request(app)
        .delete(`/api/trackers/${trackerId}/categories/${categoryId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).to.have.property('message', 'Category deleted successfully');
      expect(response.body).to.have.property('id', categoryId);

      // Verify category is deleted
      const category = await CategoryModel.findById(categoryId);
      expect(category).to.be.null;
    });

    it('should return 404 if category does not exist', async () => {
      const fakeId = '507f1f77bcf86cd799439011';

      const response = await request(app)
        .delete(`/api/trackers/${trackerId}/categories/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).to.have.property('error', 'Category not found');
    });

    it('should return 404 if tracker does not exist', async () => {
      const fakeTrackerId = '507f1f77bcf86cd799439011';
      const fakeCategoryId = '507f1f77bcf86cd799439012';

      const response = await request(app)
        .delete(`/api/trackers/${fakeTrackerId}/categories/${fakeCategoryId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).to.have.property('error', 'Tracker not found');
    });

    it('should return 401 if no auth token is provided', async () => {
      const fakeCategoryId = '507f1f77bcf86cd799439011';

      const response = await request(app)
        .delete(`/api/trackers/${trackerId}/categories/${fakeCategoryId}`)
        .expect(401);

      expect(response.body).to.have.property('error', 'Access token is required');
    });

    it('should not delete category from another user\'s tracker', async () => {
      // Create category for first user
      const categoryData = createTestCategoryData(trackerId);
      const createResponse = await request(app)
        .post(`/api/trackers/${trackerId}/categories`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(categoryData);

      const categoryId = createResponse.body.category.id;

      // Create second user
      const user2Data = createTestUserData({ phone: '9999999999' });
      const user2Response = await request(app)
        .post('/api/auth/signup')
        .send(user2Data);

      const user2Token = user2Response.body.token;

      // Try to delete first user's category with second user's token
      const response = await request(app)
        .delete(`/api/trackers/${trackerId}/categories/${categoryId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(404);

      expect(response.body).to.have.property('error', 'Tracker not found');

      // Verify category still exists
      const categoryStillExists = await CategoryModel.findById(categoryId);
      expect(categoryStillExists).to.exist;
    });
  });
});
