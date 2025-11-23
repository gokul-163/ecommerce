const request = require('supertest');
const app = require('../../server');
const User = require('../../models/User');
const Product = require('../../models/Product');
const Order = require('../../models/Order');
const Payment = require('../../models/Payment');
const jwt = require('jsonwebtoken');
const testUtils = require('../testUtils');

describe('Full E-commerce Flow', () => {
  let server;
  let testUser;
  let userToken;
  let testProduct;
  let testOrder;
  let testPayment;

  beforeAll(() => {
    server = app.listen(0);
  });

  afterAll((done) => {
    server.close(done);
  });

  describe('Complete User Journey', () => {
    it('should complete full e-commerce flow: register -> login -> browse -> order -> pay', async () => {
      // Step 1: User Registration
      const userData = testUtils.createTestUser();
      const registerResponse = await request(server)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(registerResponse.body).toHaveProperty('token');
      expect(registerResponse.body.user.email).toBe(userData.email);
      
      userToken = registerResponse.body.token;
      testUser = registerResponse.body.user;

      // Step 2: User Login
      const loginResponse = await request(server)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password
        })
        .expect(200);

      expect(loginResponse.body).toHaveProperty('token');
      expect(loginResponse.body.user.email).toBe(userData.email);

      // Step 3: Browse Products
      const productsResponse = await request(server)
        .get('/api/products')
        .expect(200);

      expect(productsResponse.body).toHaveProperty('products');
      expect(Array.isArray(productsResponse.body.products)).toBe(true);

      // Step 4: Get Product Details
      if (productsResponse.body.products.length > 0) {
        testProduct = productsResponse.body.products[0];
        
        const productDetailResponse = await request(server)
          .get(`/api/products/${testProduct._id}`)
          .expect(200);

        expect(productDetailResponse.body._id).toBe(testProduct._id);
        expect(productDetailResponse.body.name).toBe(testProduct.name);
      } else {
        // Create a test product if none exist
        const productData = testUtils.createTestProduct();
        const createProductResponse = await request(server)
          .post('/api/products')
          .set('Authorization', `Bearer ${userToken}`)
          .send(productData)
          .expect(201);

        testProduct = createProductResponse.body;
      }

      // Step 5: Create Order
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

      const orderResponse = await request(server)
        .post('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send(orderData)
        .expect(201);

      expect(orderResponse.body).toHaveProperty('_id');
      expect(orderResponse.body.user).toBe(testUser._id);
      expect(orderResponse.body.status).toBe('pending');
      expect(orderResponse.body.totalAmount).toBe(orderData.totalAmount);

      testOrder = orderResponse.body;

      // Step 6: Process Payment
      const paymentData = {
        orderId: testOrder._id,
        paymentMethod: 'card',
        amount: testOrder.totalAmount,
        currency: 'usd',
        paymentIntentId: 'pi_test_123456789'
      };

      const paymentResponse = await request(server)
        .post('/api/payments/process')
        .set('Authorization', `Bearer ${userToken}`)
        .send(paymentData)
        .expect(200);

      expect(paymentResponse.body).toHaveProperty('_id');
      expect(paymentResponse.body.orderId).toBe(testOrder._id);
      expect(paymentResponse.body.status).toBe('completed');

      testPayment = paymentResponse.body;

      // Step 7: Verify Order Status Updated
      const updatedOrderResponse = await request(server)
        .get(`/api/orders/${testOrder._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(updatedOrderResponse.body.status).toBe('paid');

      // Step 8: View Order History
      const orderHistoryResponse = await request(server)
        .get('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(orderHistoryResponse.body.orders).toHaveLength(1);
      expect(orderHistoryResponse.body.orders[0]._id).toBe(testOrder._id);

      // Step 9: View Payment History
      const paymentHistoryResponse = await request(server)
        .get('/api/payments')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(paymentHistoryResponse.body.payments).toHaveLength(1);
      expect(paymentHistoryResponse.body.payments[0]._id).toBe(testPayment._id);

      // Step 10: Update User Profile
      const profileUpdateData = {
        name: 'Updated User Name',
        phone: '9876543210'
      };

      const profileUpdateResponse = await request(server)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .send(profileUpdateData)
        .expect(200);

      expect(profileUpdateResponse.body.name).toBe(profileUpdateData.name);
      expect(profileUpdateResponse.body.phone).toBe(profileUpdateData.phone);
    });
  });

  describe('Product Search and Filtering Flow', () => {
    beforeEach(async () => {
      // Create test products
      await Product.create([
        {
          name: 'iPhone 13',
          description: 'Latest iPhone model',
          price: 999.99,
          category: 'Electronics',
          stock: 10,
          images: ['https://example.com/iphone13.jpg']
        },
        {
          name: 'Samsung Galaxy S21',
          description: 'Android flagship phone',
          price: 899.99,
          category: 'Electronics',
          stock: 15,
          images: ['https://example.com/galaxy.jpg']
        },
        {
          name: 'Nike Running Shoes',
          description: 'Comfortable running shoes',
          price: 129.99,
          category: 'Sports',
          stock: 20,
          images: ['https://example.com/nike.jpg']
        }
      ]);
    });

    it('should handle product search and filtering', async () => {
      // Search by name
      const searchResponse = await request(server)
        .get('/api/products?search=iPhone')
        .expect(200);

      expect(searchResponse.body.products).toHaveLength(1);
      expect(searchResponse.body.products[0].name).toBe('iPhone 13');

      // Filter by category
      const categoryResponse = await request(server)
        .get('/api/products?category=Electronics')
        .expect(200);

      expect(categoryResponse.body.products).toHaveLength(2);
      categoryResponse.body.products.forEach(product => {
        expect(product.category).toBe('Electronics');
      });

      // Sort by price
      const sortResponse = await request(server)
        .get('/api/products?sort=price&order=desc')
        .expect(200);

      const prices = sortResponse.body.products.map(p => p.price);
      expect(prices).toEqual([...prices].sort((a, b) => b - a));

      // Pagination
      const paginationResponse = await request(server)
        .get('/api/products?page=1&limit=2')
        .expect(200);

      expect(paginationResponse.body.products).toHaveLength(2);
      expect(paginationResponse.body).toHaveProperty('currentPage', 1);
      expect(paginationResponse.body).toHaveProperty('totalPages');
    });
  });

  describe('Order Management Flow', () => {
    let adminUser;
    let adminToken;

    beforeEach(async () => {
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

      // Create regular user
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
    });

    it('should handle complete order management flow', async () => {
      // Create order
      const orderData = {
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
        totalAmount: testProduct.price
      };

      const orderResponse = await request(server)
        .post('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send(orderData)
        .expect(201);

      testOrder = orderResponse.body;

      // Admin views all orders
      const adminOrdersResponse = await request(server)
        .get('/api/orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(adminOrdersResponse.body.orders).toHaveLength(1);
      expect(adminOrdersResponse.body.orders[0]._id).toBe(testOrder._id);

      // Admin updates order status
      const statusUpdateResponse = await request(server)
        .put(`/api/orders/${testOrder._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'processing' })
        .expect(200);

      expect(statusUpdateResponse.body.status).toBe('processing');

      // User views their order
      const userOrderResponse = await request(server)
        .get(`/api/orders/${testOrder._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(userOrderResponse.body.status).toBe('processing');

      // Admin ships the order
      const shipResponse = await request(server)
        .put(`/api/orders/${testOrder._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'shipped' })
        .expect(200);

      expect(shipResponse.body.status).toBe('shipped');

      // User cancels order (should work for pending orders)
      const cancelResponse = await request(server)
        .delete(`/api/orders/${testOrder._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(cancelResponse.body).toHaveProperty('message');

      // Verify order is cancelled
      const cancelledOrderResponse = await request(server)
        .get(`/api/orders/${testOrder._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(cancelledOrderResponse.body.status).toBe('cancelled');
    });
  });

  describe('Payment Processing Flow', () => {
    beforeEach(async () => {
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

      testProduct = await Product.create(testUtils.createTestProduct());
    });

    it('should handle complete payment processing flow', async () => {
      // Create order
      const orderData = {
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
        totalAmount: testProduct.price
      };

      const orderResponse = await request(server)
        .post('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send(orderData)
        .expect(201);

      testOrder = orderResponse.body;

      // Process payment
      const paymentData = {
        orderId: testOrder._id,
        paymentMethod: 'card',
        amount: testOrder.totalAmount,
        currency: 'usd',
        paymentIntentId: 'pi_test_123456789'
      };

      const paymentResponse = await request(server)
        .post('/api/payments/process')
        .set('Authorization', `Bearer ${userToken}`)
        .send(paymentData)
        .expect(200);

      testPayment = paymentResponse.body;

      // Verify payment
      const verifyResponse = await request(server)
        .post('/api/payments/verify')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          paymentIntentId: testPayment.paymentIntentId,
          status: 'succeeded'
        })
        .expect(200);

      expect(verifyResponse.body.verified).toBe(true);

      // View payment details
      const paymentDetailResponse = await request(server)
        .get(`/api/payments/${testPayment._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(paymentDetailResponse.body._id).toBe(testPayment._id);
      expect(paymentDetailResponse.body.status).toBe('completed');

      // Process refund
      const refundResponse = await request(server)
        .post('/api/payments/refund')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          paymentId: testPayment._id,
          amount: testPayment.amount,
          reason: 'Customer request'
        })
        .expect(200);

      expect(refundResponse.body).toHaveProperty('refundId');
      expect(refundResponse.body.status).toBe('refunded');
    });
  });
});



