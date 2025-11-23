const request = require('supertest');
const app = require('../../server');
const Payment = require('../../models/Payment');
const Order = require('../../models/Order');
const User = require('../../models/User');
const Product = require('../../models/Product');
const jwt = require('jsonwebtoken');

describe('Payments API Endpoints', () => {
  let server;
  let testUser;
  let userToken;
  let testOrder;
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

    // Create test product
    testProduct = await Product.create(testUtils.createTestProduct());

    // Create test order
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

  describe('POST /api/payments/process', () => {
    it('should process payment successfully', async () => {
      const paymentData = {
        orderId: testOrder._id,
        paymentMethod: 'card',
        amount: testOrder.totalAmount,
        currency: 'usd',
        paymentIntentId: 'pi_test_123456789'
      };

      const response = await request(server)
        .post('/api/payments/process')
        .set('Authorization', `Bearer ${userToken}`)
        .send(paymentData)
        .expect(200);

      expect(response.body).toHaveProperty('_id');
      expect(response.body.orderId).toBe(testOrder._id.toString());
      expect(response.body.status).toBe('completed');
      expect(response.body.amount).toBe(paymentData.amount);
    });

    it('should return 401 without authentication', async () => {
      const paymentData = {
        orderId: testOrder._id,
        paymentMethod: 'card',
        amount: testOrder.totalAmount
      };

      const response = await request(server)
        .post('/api/payments/process')
        .send(paymentData)
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });

    it('should validate required fields', async () => {
      const response = await request(server)
        .post('/api/payments/process')
        .set('Authorization', `Bearer ${userToken}`)
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('errors');
    });

    it('should validate order exists', async () => {
      const fakeOrderId = '507f1f77bcf86cd799439011';
      const paymentData = {
        orderId: fakeOrderId,
        paymentMethod: 'card',
        amount: 99.99
      };

      const response = await request(server)
        .post('/api/payments/process')
        .set('Authorization', `Bearer ${userToken}`)
        .send(paymentData)
        .expect(404);

      expect(response.body).toHaveProperty('message');
    });

    it('should validate order belongs to user', async () => {
      const otherUser = await User.create({
        name: 'Other User',
        email: 'other@example.com',
        password: 'password123'
      });

      const otherOrder = await Order.create({
        user: otherUser._id,
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

      const paymentData = {
        orderId: otherOrder._id,
        paymentMethod: 'card',
        amount: otherOrder.totalAmount
      };

      const response = await request(server)
        .post('/api/payments/process')
        .set('Authorization', `Bearer ${userToken}`)
        .send(paymentData)
        .expect(403);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('GET /api/payments', () => {
    let testPayment;

    beforeEach(async () => {
      testPayment = await Payment.create({
        orderId: testOrder._id,
        userId: testUser._id,
        amount: testOrder.totalAmount,
        currency: 'usd',
        paymentMethod: 'card',
        status: 'completed',
        paymentIntentId: 'pi_test_123456789'
      });
    });

    it('should get user payments', async () => {
      const response = await request(server)
        .get('/api/payments')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('payments');
      expect(response.body.payments).toHaveLength(1);
      expect(response.body.payments[0]._id).toBe(testPayment._id.toString());
    });

    it('should return 401 without authentication', async () => {
      const response = await request(server)
        .get('/api/payments')
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });

    it('should filter payments by status', async () => {
      const response = await request(server)
        .get('/api/payments?status=completed')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.payments).toHaveLength(1);
      response.body.payments.forEach(payment => {
        expect(payment.status).toBe('completed');
      });
    });

    it('should paginate payments', async () => {
      // Create additional payments
      await Payment.create([
        {
          orderId: testOrder._id,
          userId: testUser._id,
          amount: 50.00,
          currency: 'usd',
          paymentMethod: 'card',
          status: 'completed',
          paymentIntentId: 'pi_test_987654321'
        },
        {
          orderId: testOrder._id,
          userId: testUser._id,
          amount: 75.00,
          currency: 'usd',
          paymentMethod: 'card',
          status: 'completed',
          paymentIntentId: 'pi_test_456789123'
        }
      ]);

      const response = await request(server)
        .get('/api/payments?page=1&limit=2')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.payments).toHaveLength(2);
      expect(response.body).toHaveProperty('currentPage', 1);
      expect(response.body).toHaveProperty('totalPages');
    });
  });

  describe('GET /api/payments/:id', () => {
    let testPayment;

    beforeEach(async () => {
      testPayment = await Payment.create({
        orderId: testOrder._id,
        userId: testUser._id,
        amount: testOrder.totalAmount,
        currency: 'usd',
        paymentMethod: 'card',
        status: 'completed',
        paymentIntentId: 'pi_test_123456789'
      });
    });

    it('should get payment by id for owner', async () => {
      const response = await request(server)
        .get(`/api/payments/${testPayment._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body._id).toBe(testPayment._id.toString());
      expect(response.body.userId).toBe(testUser._id.toString());
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
        .get(`/api/payments/${testPayment._id}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 404 for non-existent payment', async () => {
      const fakeId = '507f1f77bcf86cd799439011';

      const response = await request(server)
        .get(`/api/payments/${fakeId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('POST /api/payments/verify', () => {
    let testPayment;

    beforeEach(async () => {
      testPayment = await Payment.create({
        orderId: testOrder._id,
        userId: testUser._id,
        amount: testOrder.totalAmount,
        currency: 'usd',
        paymentMethod: 'card',
        status: 'pending',
        paymentIntentId: 'pi_test_123456789'
      });
    });

    it('should verify payment successfully', async () => {
      const verifyData = {
        paymentIntentId: testPayment.paymentIntentId,
        status: 'succeeded'
      };

      const response = await request(server)
        .post('/api/payments/verify')
        .set('Authorization', `Bearer ${userToken}`)
        .send(verifyData)
        .expect(200);

      expect(response.body.status).toBe('completed');
      expect(response.body.verified).toBe(true);
    });

    it('should return 404 for non-existent payment', async () => {
      const verifyData = {
        paymentIntentId: 'pi_nonexistent',
        status: 'succeeded'
      };

      const response = await request(server)
        .post('/api/payments/verify')
        .set('Authorization', `Bearer ${userToken}`)
        .send(verifyData)
        .expect(404);

      expect(response.body).toHaveProperty('message');
    });

    it('should validate required fields', async () => {
      const response = await request(server)
        .post('/api/payments/verify')
        .set('Authorization', `Bearer ${userToken}`)
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('errors');
    });
  });

  describe('POST /api/payments/refund', () => {
    let testPayment;

    beforeEach(async () => {
      testPayment = await Payment.create({
        orderId: testOrder._id,
        userId: testUser._id,
        amount: testOrder.totalAmount,
        currency: 'usd',
        paymentMethod: 'card',
        status: 'completed',
        paymentIntentId: 'pi_test_123456789'
      });
    });

    it('should process refund successfully', async () => {
      const refundData = {
        paymentId: testPayment._id,
        amount: testPayment.amount,
        reason: 'Customer request'
      };

      const response = await request(server)
        .post('/api/payments/refund')
        .set('Authorization', `Bearer ${userToken}`)
        .send(refundData)
        .expect(200);

      expect(response.body).toHaveProperty('refundId');
      expect(response.body.status).toBe('refunded');
    });

    it('should return 404 for non-existent payment', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const refundData = {
        paymentId: fakeId,
        amount: 99.99,
        reason: 'Customer request'
      };

      const response = await request(server)
        .post('/api/payments/refund')
        .set('Authorization', `Bearer ${userToken}`)
        .send(refundData)
        .expect(404);

      expect(response.body).toHaveProperty('message');
    });

    it('should validate refund amount', async () => {
      const refundData = {
        paymentId: testPayment._id,
        amount: testPayment.amount + 100, // More than original amount
        reason: 'Customer request'
      };

      const response = await request(server)
        .post('/api/payments/refund')
        .set('Authorization', `Bearer ${userToken}`)
        .send(refundData)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });
  });
});



