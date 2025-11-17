import { expect } from 'chai';
import request from 'supertest';
import { Express } from 'express';
import { connectTestDB, disconnectTestDB, clearTestDB, createTestUserData, createTestTrackerData, generateTestToken } from './helpers';
import { createTestApp } from './helpers/testServer';
import TrackerModel from '../src/models/Tracker';
import UserModel from '../src/models/User';

describe('Tracker API Tests', () => {
  let app: Express;
  let authToken: string;
  let userId: string;

  before(async () => {
    await connectTestDB();
    app = createTestApp();
  });

  after(async () => {
    await disconnectTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();

    // Create a test user and get auth token
    const userData = createTestUserData();
    const response = await request(app)
      .post('/api/auth/signup')
      .send(userData);

    authToken = response.body.token;
    userId = response.body.user.id;
  });

  describe('POST /api/trackers', () => {
    it('should create a new tracker with valid data', async () => {
      const trackerData = createTestTrackerData();

      const response = await request(app)
        .post('/api/trackers')
        .set('Authorization', `Bearer ${authToken}`)
        .send(trackerData)
        .expect(201);

      expect(response.body).to.have.property('message', 'Tracker created successfully');
      expect(response.body.tracker).to.have.property('id');
      expect(response.body.tracker).to.have.property('name', trackerData.name);
      expect(response.body.tracker).to.have.property('type', trackerData.type);
      expect(response.body.tracker).to.have.property('description', trackerData.description);
      expect(response.body.tracker).to.have.property('currency', trackerData.currency);
    });

    it('should return 400 if required fields are missing', async () => {
      const response = await request(app)
        .post('/api/trackers')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Tracker',
          // Missing type
        })
        .expect(400);

      expect(response.body).to.have.property('error', 'Name and type are required');
    });

    it('should return 401 if no auth token is provided', async () => {
      const trackerData = createTestTrackerData();

      const response = await request(app)
        .post('/api/trackers')
        .send(trackerData)
        .expect(401);

      expect(response.body).to.have.property('error', 'Access token is required');
    });

    it('should use default currency if not provided', async () => {
      const trackerData = {
        name: 'Test Tracker',
        type: 'personal',
        description: 'A test tracker',
      };

      const response = await request(app)
        .post('/api/trackers')
        .set('Authorization', `Bearer ${authToken}`)
        .send(trackerData)
        .expect(201);

      expect(response.body.tracker).to.have.property('currency', 'INR');
    });
  });

  describe('GET /api/trackers', () => {
    it('should get all trackers for authenticated user', async () => {
      // Create multiple trackers
      const tracker1 = createTestTrackerData({ name: 'Tracker 1' });
      const tracker2 = createTestTrackerData({ name: 'Tracker 2' });

      await request(app)
        .post('/api/trackers')
        .set('Authorization', `Bearer ${authToken}`)
        .send(tracker1);

      await request(app)
        .post('/api/trackers')
        .set('Authorization', `Bearer ${authToken}`)
        .send(tracker2);

      const response = await request(app)
        .get('/api/trackers')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.trackers).to.be.an('array');
      expect(response.body.trackers).to.have.lengthOf(2);
      expect(response.body.trackers[0]).to.have.property('name', 'Tracker 2'); // Most recent first
      expect(response.body.trackers[1]).to.have.property('name', 'Tracker 1');
    });

    it('should return empty array if user has no trackers', async () => {
      const response = await request(app)
        .get('/api/trackers')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.trackers).to.be.an('array');
      expect(response.body.trackers).to.have.lengthOf(0);
    });

    it('should return 401 if no auth token is provided', async () => {
      const response = await request(app)
        .get('/api/trackers')
        .expect(401);

      expect(response.body).to.have.property('error', 'Access token is required');
    });

    it('should only return trackers belonging to authenticated user', async () => {
      // Create tracker for first user
      await request(app)
        .post('/api/trackers')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createTestTrackerData({ name: 'User 1 Tracker' }));

      // Create second user
      const user2Data = createTestUserData({ phone: '9999999999' });
      const user2Response = await request(app)
        .post('/api/auth/signup')
        .send(user2Data);

      const user2Token = user2Response.body.token;

      // Create tracker for second user
      await request(app)
        .post('/api/trackers')
        .set('Authorization', `Bearer ${user2Token}`)
        .send(createTestTrackerData({ name: 'User 2 Tracker' }));

      // First user should only see their tracker
      const response = await request(app)
        .get('/api/trackers')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.trackers).to.have.lengthOf(1);
      expect(response.body.trackers[0]).to.have.property('name', 'User 1 Tracker');
    });
  });

  describe('GET /api/trackers/:id', () => {
    it('should get a specific tracker by id', async () => {
      const trackerData = createTestTrackerData();
      const createResponse = await request(app)
        .post('/api/trackers')
        .set('Authorization', `Bearer ${authToken}`)
        .send(trackerData);

      const trackerId = createResponse.body.tracker.id;

      const response = await request(app)
        .get(`/api/trackers/${trackerId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.tracker).to.have.property('id', trackerId);
      expect(response.body.tracker).to.have.property('name', trackerData.name);
    });

    it('should return 404 if tracker does not exist', async () => {
      const fakeId = '507f1f77bcf86cd799439011'; // Valid MongoDB ObjectId

      const response = await request(app)
        .get(`/api/trackers/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).to.have.property('error', 'Tracker not found');
    });

    it('should return 404 if tracker belongs to another user', async () => {
      // Create tracker for first user
      const tracker = createTestTrackerData();
      const createResponse = await request(app)
        .post('/api/trackers')
        .set('Authorization', `Bearer ${authToken}`)
        .send(tracker);

      const trackerId = createResponse.body.tracker.id;

      // Create second user
      const user2Data = createTestUserData({ phone: '9999999999' });
      const user2Response = await request(app)
        .post('/api/auth/signup')
        .send(user2Data);

      const user2Token = user2Response.body.token;

      // Try to access first user's tracker with second user's token
      const response = await request(app)
        .get(`/api/trackers/${trackerId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(404);

      expect(response.body).to.have.property('error', 'Tracker not found');
    });
  });

  describe('PUT /api/trackers/:id', () => {
    it('should update a tracker', async () => {
      const trackerData = createTestTrackerData();
      const createResponse = await request(app)
        .post('/api/trackers')
        .set('Authorization', `Bearer ${authToken}`)
        .send(trackerData);

      const trackerId = createResponse.body.tracker.id;

      const updateData = {
        name: 'Updated Tracker Name',
        type: 'business',
        description: 'Updated description',
        currency: 'USD',
      };

      const response = await request(app)
        .put(`/api/trackers/${trackerId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).to.have.property('message', 'Tracker updated successfully');
      expect(response.body.tracker).to.have.property('name', updateData.name);
      expect(response.body.tracker).to.have.property('type', updateData.type);
      expect(response.body.tracker).to.have.property('description', updateData.description);
      expect(response.body.tracker).to.have.property('currency', updateData.currency);
    });

    it('should return 404 if tracker does not exist', async () => {
      const fakeId = '507f1f77bcf86cd799439011';

      const response = await request(app)
        .put(`/api/trackers/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated Name' })
        .expect(404);

      expect(response.body).to.have.property('error', 'Tracker not found');
    });
  });

  describe('DELETE /api/trackers/:id', () => {
    it('should delete a tracker and its associated expenses', async () => {
      const trackerData = createTestTrackerData();
      const createResponse = await request(app)
        .post('/api/trackers')
        .set('Authorization', `Bearer ${authToken}`)
        .send(trackerData);

      const trackerId = createResponse.body.tracker.id;

      const response = await request(app)
        .delete(`/api/trackers/${trackerId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).to.have.property('message', 'Tracker and associated expenses deleted successfully');
      expect(response.body).to.have.property('id', trackerId);

      // Verify tracker is deleted
      const tracker = await TrackerModel.findById(trackerId);
      expect(tracker).to.be.null;
    });

    it('should return 404 if tracker does not exist', async () => {
      const fakeId = '507f1f77bcf86cd799439011';

      const response = await request(app)
        .delete(`/api/trackers/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).to.have.property('error', 'Tracker not found');
    });

    it('should not allow deleting another user\'s tracker', async () => {
      // Create tracker for first user
      const tracker = createTestTrackerData();
      const createResponse = await request(app)
        .post('/api/trackers')
        .set('Authorization', `Bearer ${authToken}`)
        .send(tracker);

      const trackerId = createResponse.body.tracker.id;

      // Create second user
      const user2Data = createTestUserData({ phone: '9999999999' });
      const user2Response = await request(app)
        .post('/api/auth/signup')
        .send(user2Data);

      const user2Token = user2Response.body.token;

      // Try to delete first user's tracker with second user's token
      const response = await request(app)
        .delete(`/api/trackers/${trackerId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(404);

      expect(response.body).to.have.property('error', 'Tracker not found');

      // Verify tracker still exists
      const trackerStillExists = await TrackerModel.findById(trackerId);
      expect(trackerStillExists).to.exist;
    });
  });
});
