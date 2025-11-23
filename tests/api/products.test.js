const request = require('supertest');
const app = require('../../server');
const Product = require('../../models/Product');
const User = require('../../models/User');
const jwt = require('jsonwebtoken');

describe('Products API Endpoints', () => {
  let server;
  let adminUser;
  let adminToken;
  let regularUser;
  let regularToken;

  beforeAll(() => {
    server = app.listen(0);
  });

  afterAll((done) => {
    server.close(done);
  });

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
    regularUser = await User.create({
      name: 'Regular User',
      email: 'user@example.com',
      password: 'password123',
      role: 'user'
    });

    regularToken = jwt.sign(
      { userId: regularUser._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1h' }
    );
  });

  describe('GET /api/products', () => {
    beforeEach(async () => {
      await Product.create([
        testUtils.createTestProduct(),
        {
          name: 'Product 2',
          description: 'Second product',
          price: 149.99,
          category: 'Electronics',
          stock: 5,
          images: ['https://example.com/image2.jpg']
        },
        {
          name: 'Product 3',
          description: 'Third product',
          price: 79.99,
          category: 'Clothing',
          stock: 15,
          images: ['https://example.com/image3.jpg']
        }
      ]);
    });

    it('should get all products', async () => {
      const response = await request(server)
        .get('/api/products')
        .expect(200);

      expect(response.body).toHaveProperty('products');
      expect(response.body).toHaveProperty('totalProducts');
      expect(response.body.products).toHaveLength(3);
    });

    it('should filter products by category', async () => {
      const response = await request(server)
        .get('/api/products?category=Electronics')
        .expect(200);

      expect(response.body.products).toHaveLength(2);
      response.body.products.forEach(product => {
        expect(product.category).toBe('Electronics');
      });
    });

    it('should search products by name', async () => {
      const response = await request(server)
        .get('/api/products?search=Product 2')
        .expect(200);

      expect(response.body.products).toHaveLength(1);
      expect(response.body.products[0].name).toBe('Product 2');
    });

    it('should paginate products', async () => {
      const response = await request(server)
        .get('/api/products?page=1&limit=2')
        .expect(200);

      expect(response.body.products).toHaveLength(2);
      expect(response.body).toHaveProperty('currentPage', 1);
      expect(response.body).toHaveProperty('totalPages');
    });

    it('should sort products by price', async () => {
      const response = await request(server)
        .get('/api/products?sort=price&order=asc')
        .expect(200);

      const prices = response.body.products.map(p => p.price);
      expect(prices).toEqual([...prices].sort((a, b) => a - b));
    });
  });

  describe('GET /api/products/:id', () => {
    let testProduct;

    beforeEach(async () => {
      testProduct = await Product.create(testUtils.createTestProduct());
    });

    it('should get product by id', async () => {
      const response = await request(server)
        .get(`/api/products/${testProduct._id}`)
        .expect(200);

      expect(response.body._id).toBe(testProduct._id.toString());
      expect(response.body.name).toBe(testProduct.name);
    });

    it('should return 404 for non-existent product', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(server)
        .get(`/api/products/${fakeId}`)
        .expect(404);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 400 for invalid id format', async () => {
      const response = await request(server)
        .get('/api/products/invalid-id')
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('POST /api/products', () => {
    it('should create product with admin privileges', async () => {
      const productData = testUtils.createTestProduct();

      const response = await request(server)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(productData)
        .expect(201);

      expect(response.body.name).toBe(productData.name);
      expect(response.body.price).toBe(productData.price);
      expect(response.body).toHaveProperty('_id');
    });

    it('should return 403 for non-admin users', async () => {
      const productData = testUtils.createTestProduct();

      const response = await request(server)
        .post('/api/products')
        .set('Authorization', `Bearer ${regularToken}`)
        .send(productData)
        .expect(403);

      expect(response.body).toHaveProperty('message');
    });

    it('should validate required fields', async () => {
      const response = await request(server)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('errors');
    });

    it('should return 401 without token', async () => {
      const productData = testUtils.createTestProduct();

      const response = await request(server)
        .post('/api/products')
        .send(productData)
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('PUT /api/products/:id', () => {
    let testProduct;

    beforeEach(async () => {
      testProduct = await Product.create(testUtils.createTestProduct());
    });

    it('should update product with admin privileges', async () => {
      const updateData = {
        name: 'Updated Product Name',
        price: 129.99
      };

      const response = await request(server)
        .put(`/api/products/${testProduct._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.name).toBe(updateData.name);
      expect(response.body.price).toBe(updateData.price);
    });

    it('should return 403 for non-admin users', async () => {
      const updateData = { name: 'Updated Name' };

      const response = await request(server)
        .put(`/api/products/${testProduct._id}`)
        .set('Authorization', `Bearer ${regularToken}`)
        .send(updateData)
        .expect(403);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 404 for non-existent product', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const updateData = { name: 'Updated Name' };

      const response = await request(server)
        .put(`/api/products/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(404);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('DELETE /api/products/:id', () => {
    let testProduct;

    beforeEach(async () => {
      testProduct = await Product.create(testUtils.createTestProduct());
    });

    it('should delete product with admin privileges', async () => {
      const response = await request(server)
        .delete(`/api/products/${testProduct._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');

      // Verify product is deleted
      const deletedProduct = await Product.findById(testProduct._id);
      expect(deletedProduct).toBeNull();
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(server)
        .delete(`/api/products/${testProduct._id}`)
        .set('Authorization', `Bearer ${regularToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 404 for non-existent product', async () => {
      const fakeId = '507f1f77bcf86cd799439011';

      const response = await request(server)
        .delete(`/api/products/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('GET /api/products/categories', () => {
    beforeEach(async () => {
      await Product.create([
        { ...testUtils.createTestProduct(), category: 'Electronics' },
        { ...testUtils.createTestProduct(), category: 'Clothing' },
        { ...testUtils.createTestProduct(), category: 'Electronics' },
        { ...testUtils.createTestProduct(), category: 'Books' }
      ]);
    });

    it('should get all unique categories', async () => {
      const response = await request(server)
        .get('/api/products/categories')
        .expect(200);

      expect(response.body).toHaveProperty('categories');
      expect(response.body.categories).toContain('Electronics');
      expect(response.body.categories).toContain('Clothing');
      expect(response.body.categories).toContain('Books');
    });
  });
});



