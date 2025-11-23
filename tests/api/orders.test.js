const request = require('supertest');
const app = require('../../server');
const Order = require('../../models/Order');
const Product = require('../../models/Product');
const User = require('../../models/User');
const jwt = require('jsonwebtoken');

describe('Orders API Endpoints', () => {
  let server;
  let testUser;
  let userToken;
  let adminUser;
  let adminToken;
  let testProduct;

  beforeAll(() => {
    server = app.listen(0);
  });

  afterAll((done) => {
    server.close(done);
  });

  beforeEach(async () => {
    // Create test user
    testUser = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      role: 'user'
    });

    userToken = jwt.sign(
      { userId: testUser._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1h' }
    );

    // Create admin user
    adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'password123',
      role: 'admin'
    });

    adminToken = jwt.sign(
      { userId: adminUser._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1h' }
    );

    // Create test product
    testProduct = await Product.create(testUtils.createTestProduct());
  });

  describe('POST /api/orders', () => {
    it('should create a new order successfully', async () => {
      const orderData = {
        products: [
          {
            product: testProduct._id,
            quantity: 2,
            price: testProduct.price
          }
        ],
        shippingAddress: {
          address: '123 Test St',
          city: 'Test City',
          state: 'Test State',
          country: 'Test Country',
          zipCode: '12345'
        },
        paymentMethod: 'card',
        totalAmount: testProduct.price * 2
      };

      const response = await request(server)
        .post('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send(orderData)
        .expect(201);

      expect(response.body).toHaveProperty('_id');
      expect(response.body.user).toBe(testUser._id.toString());
      expect(response.body.products).toHaveLength(1);
      expect(response.body.status).toBe('pending');
      expect(response.body.totalAmount).toBe(orderData.totalAmount);
    });

    it('should return 401 without authentication', async () => {
      const orderData = testUtils.createTestOrder(testUser._id, [
        {
          product: testProduct._id,
          quantity: 1,
          price: testProduct.price
        }
      ]);

      const response = await request(server)
        .post('/api/orders')
        .send(orderData)
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });

    it('should validate required fields', async () => {
      const response = await request(server)
        .post('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('errors');
    });

    it('should validate product exists', async () => {
      const fakeProductId = '507f1f77bcf86cd799439011';
      const orderData = {
        products: [
          {
            product: fakeProductId,
            quantity: 1,
            price: 99.99
          }
        ],
        shippingAddress: {
          address: '123 Test St',
          city: 'Test City',
          state: 'Test State',
          country: 'Test Country',
          zipCode: '12345'
        },
        paymentMethod: 'card',
        totalAmount: 99.99
      };

      const response = await request(server)
        .post('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send(orderData)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('GET /api/orders', () => {
    let testOrder;

    beforeEach(async () => {
      testOrder = await Order.create({
        user: testUser._id,
        products: [
          {
            product: testProduct._id,
            quantity: 1,
            price: testProduct.price
          }
        ],
        shippingAddress: {
          address: '123 Test St',
          city: 'Test City',
          state: 'Test State',
          country: 'Test Country',
          zipCode: '12345'
        },
        paymentMethod: 'card',
        totalAmount: testProduct.price,
        status: 'pending'
      });
    });

    it('should get user orders', async () => {
      const response = await request(server)
        .get('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('orders');
      expect(response.body.orders).toHaveLength(1);
      expect(response.body.orders[0]._id).toBe(testOrder._id.toString());
    });

    it('should get all orders for admin', async () => {
      const response = await request(server)
        .get('/api/orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('orders');
      expect(response.body.orders).toHaveLength(1);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(server)
        .get('/api/orders')
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });

    it('should filter orders by status', async () => {
      const response = await request(server)
        .get('/api/orders?status=pending')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.orders).toHaveLength(1);
      response.body.orders.forEach(order => {
        expect(order.status).toBe('pending');
      });
    });
  });

  describe('GET /api/orders/:id', () => {
    let testOrder;

    beforeEach(async () => {
      testOrder = await Order.create({
        user: testUser._id,
        products: [
          {
            product: testProduct._id,
            quantity: 1,
            price: testProduct.price
          }
        ],
        shippingAddress: {
          address: '123 Test St',
          city: 'Test City',
          state: 'Test State',
          country: 'Test Country',
          zipCode: '12345'
        },
        paymentMethod: 'card',
        totalAmount: testProduct.price,
        status: 'pending'
      });
    });

    it('should get order by id for owner', async () => {
      const response = await request(server)
        .get(`/api/orders/${testOrder._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body._id).toBe(testOrder._id.toString());
      expect(response.body.user).toBe(testUser._id.toString());
    });

    it('should get order by id for admin', async () => {
      const response = await request(server)
        .get(`/api/orders/${testOrder._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body._id).toBe(testOrder._id.toString());
    });

    it('should return 403 for non-owner user', async () => {
      const otherUser = await User.create({
        name: 'Other User',
        email: 'other@example.com',
        password: 'password123'
      });

      const otherToken = jwt.sign(
        { userId: otherUser._id },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '1h' }
      );

      const response = await request(server)
        .get(`/api/orders/${testOrder._id}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 404 for non-existent order', async () => {
      const fakeId = '507f1f77bcf86cd799439011';

      const response = await request(server)
        .get(`/api/orders/${fakeId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('PUT /api/orders/:id/status', () => {
    let testOrder;

    beforeEach(async () => {
      testOrder = await Order.create({
        user: testUser._id,
        products: [
          {
            product: testProduct._id,
            quantity: 1,
            price: testProduct.price
          }
        ],
        shippingAddress: {
          address: '123 Test St',
          city: 'Test City',
          state: 'Test State',
          country: 'Test Country',
          zipCode: '12345'
        },
        paymentMethod: 'card',
        totalAmount: testProduct.price,
        status: 'pending'
      });
    });

    it('should update order status by admin', async () => {
      const updateData = { status: 'shipped' };

      const response = await request(server)
        .put(`/api/orders/${testOrder._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.status).toBe('shipped');
    });

    it('should return 403 for non-admin users', async () => {
      const updateData = { status: 'shipped' };

      const response = await request(server)
        .put(`/api/orders/${testOrder._id}/status`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData)
        .expect(403);

      expect(response.body).toHaveProperty('message');
    });

    it('should validate status values', async () => {
      const updateData = { status: 'invalid-status' };

      const response = await request(server)
        .put(`/api/orders/${testOrder._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 404 for non-existent order', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const updateData = { status: 'shipped' };

      const response = await request(server)
        .put(`/api/orders/${fakeId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(404);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('DELETE /api/orders/:id', () => {
    let testOrder;

    beforeEach(async () => {
      testOrder = await Order.create({
        user: testUser._id,
        products: [
          {
            product: testProduct._id,
            quantity: 1,
            price: testProduct.price
          }
        ],
        shippingAddress: {
          address: '123 Test St',
          city: 'Test City',
          state: 'Test State',
          country: 'Test Country',
          zipCode: '12345'
        },
        paymentMethod: 'card',
        totalAmount: testProduct.price,
        status: 'pending'
      });
    });

    it('should cancel order by owner', async () => {
      const response = await request(server)
        .delete(`/api/orders/${testOrder._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');

      // Verify order is cancelled
      const cancelledOrder = await Order.findById(testOrder._id);
      expect(cancelledOrder.status).toBe('cancelled');
    });

    it('should return 403 for non-owner user', async () => {
      const otherUser = await User.create({
        name: 'Other User',
        email: 'other@example.com',
        password: 'password123'
      });

      const otherToken = jwt.sign(
        { userId: otherUser._id },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '1h' }
      );

      const response = await request(server)
        .delete(`/api/orders/${testOrder._id}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 404 for non-existent order', async () => {
      const fakeId = '507f1f77bcf86cd799439011';

      const response = await request(server)
        .delete(`/api/orders/${fakeId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('message');
    });
  });
});



