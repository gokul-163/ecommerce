const request = require('supertest');
const app = require('../../server');
const User = require('../../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

describe('Auth API Endpoints', () => {
  let server;

  beforeAll(() => {
    server = app.listen(0); // Use random port for testing
  });

  afterAll((done) => {
    server.close(done);
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = testUtils.createTestUser();

      const response = await request(server)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('_id');
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user.name).toBe(userData.name);
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should return error for duplicate email', async () => {
      const userData = testUtils.createTestUser();

      // Register first user
      await request(server)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Try to register with same email
      const response = await request(server)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('already exists');
    });

    it('should validate required fields', async () => {
      const response = await request(server)
        .post('/api/auth/register')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('errors');
    });
  });

  describe('POST /api/auth/login', () => {
    let testUser;

    beforeEach(async () => {
      const userData = testUtils.createTestUser();
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      testUser = await User.create({
        ...userData,
        password: hashedPassword
      });
    });

    it('should login user with valid credentials', async () => {
      const loginData = {
        email: testUser.email,
        password: 'password123'
      };

      const response = await request(server)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('_id');
      expect(response.body.user.email).toBe(testUser.email);
    });

    it('should return error for invalid credentials', async () => {
      const loginData = {
        email: testUser.email,
        password: 'wrongpassword'
      };

      const response = await request(server)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Invalid credentials');
    });

    it('should return error for non-existent user', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };

      const response = await request(server)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('GET /api/auth/me', () => {
    let testUser;
    let authToken;

    beforeEach(async () => {
      const userData = testUtils.createTestUser();
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      testUser = await User.create({
        ...userData,
        password: hashedPassword
      });

      authToken = jwt.sign(
        { userId: testUser._id },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '1h' }
      );
    });

    it('should get current user profile with valid token', async () => {
      const response = await request(server)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('_id');
      expect(response.body.email).toBe(testUser.email);
      expect(response.body.name).toBe(testUser.name);
      expect(response.body).not.toHaveProperty('password');
    });

    it('should return error without token', async () => {
      const response = await request(server)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });

    it('should return error with invalid token', async () => {
      const response = await request(server)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('PUT /api/auth/profile', () => {
    let testUser;
    let authToken;

    beforeEach(async () => {
      const userData = testUtils.createTestUser();
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      testUser = await User.create({
        ...userData,
        password: hashedPassword
      });

      authToken = jwt.sign(
        { userId: testUser._id },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '1h' }
      );
    });

    it('should update user profile successfully', async () => {
      const updateData = {
        name: 'Updated Name',
        phone: '9876543210'
      };

      const response = await request(server)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.name).toBe(updateData.name);
      expect(response.body.phone).toBe(updateData.phone);
    });

    it('should return error without token', async () => {
      const updateData = { name: 'Updated Name' };

      const response = await request(server)
        .put('/api/auth/profile')
        .send(updateData)
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });
  });
});



