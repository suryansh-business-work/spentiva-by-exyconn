import { expect } from 'chai';
import request from 'supertest';
import { Express } from 'express';
import { connectTestDB, disconnectTestDB, clearTestDB, createTestUserData } from './helpers';
import { createTestApp } from './helpers/testServer';
import UserModel from '../src/models/User';

describe('Auth API Tests', () => {
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

  describe('POST /api/auth/signup', () => {
    it('should create a new user with valid data', async () => {
      const userData = createTestUserData();

      const response = await request(app)
        .post('/api/auth/signup')
        .send(userData)
        .expect(201);

      expect(response.body).to.have.property('message', 'User created successfully');
      expect(response.body).to.have.property('token');
      expect(response.body.user).to.have.property('id');
      expect(response.body.user).to.have.property('name', userData.name);
      expect(response.body.user).to.have.property('phone', userData.phone);
      expect(response.body.user).to.have.property('accountType', userData.accountType);
      expect(response.body.user).to.not.have.property('password');
    });

    it('should return 400 if required fields are missing', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          name: 'Test User',
          // Missing phone and password
        })
        .expect(400);

      expect(response.body).to.have.property('error', 'Missing required fields');
    });

    it('should return 400 if phone number is already registered', async () => {
      const userData = createTestUserData();

      // Create first user
      await request(app)
        .post('/api/auth/signup')
        .send(userData)
        .expect(201);

      // Try to create second user with same phone
      const response = await request(app)
        .post('/api/auth/signup')
        .send(userData)
        .expect(400);

      expect(response.body).to.have.property('error', 'Phone number already registered');
    });

    it('should hash the password before saving', async () => {
      const userData = createTestUserData();

      await request(app)
        .post('/api/auth/signup')
        .send(userData)
        .expect(201);

      const user = await UserModel.findOne({ phone: userData.phone }).select('+password');
      expect(user).to.exist;
      expect(user!.password).to.exist;
      expect(user!.password).to.not.equal(userData.password);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const userData = createTestUserData();

      // First create a user
      await request(app)
        .post('/api/auth/signup')
        .send(userData);

      // Then try to login
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          phone: userData.phone,
          password: userData.password,
        })
        .expect(200);

      expect(response.body).to.have.property('message', 'Login successful');
      expect(response.body).to.have.property('token');
      expect(response.body.user).to.have.property('name', userData.name);
      expect(response.body.user).to.have.property('phone', userData.phone);
    });

    it('should return 400 if phone or password is missing', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          phone: '9876543210',
          // Missing password
        })
        .expect(400);

      expect(response.body).to.have.property('error', 'Phone and password are required');
    });

    it('should return 401 if user does not exist', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          phone: '9999999999',
          password: 'TestPassword123!',
        })
        .expect(401);

      expect(response.body).to.have.property('error', 'Invalid credentials');
    });

    it('should return 401 if password is incorrect', async () => {
      const userData = createTestUserData();

      // Create a user
      await request(app)
        .post('/api/auth/signup')
        .send(userData);

      // Try to login with wrong password
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          phone: userData.phone,
          password: 'WrongPassword123!',
        })
        .expect(401);

      expect(response.body).to.have.property('error', 'Invalid credentials');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return user profile with valid token', async () => {
      const userData = createTestUserData();

      // Signup to get token
      const signupResponse = await request(app)
        .post('/api/auth/signup')
        .send(userData);

      const token = signupResponse.body.token;

      // Get profile
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.user).to.have.property('id');
      expect(response.body.user).to.have.property('name', userData.name);
      expect(response.body.user).to.have.property('phone', userData.phone);
      expect(response.body.user).to.not.have.property('password');
    });

    it('should return 401 if no token is provided', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body).to.have.property('error', 'Access token is required');
    });

    it('should return 403 if token is invalid', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(403);

      expect(response.body).to.have.property('error', 'Invalid or expired token');
    });
  });
});
