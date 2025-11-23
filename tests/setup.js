const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongod;

// Setup MongoDB Memory Server
beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

// Clean up after each test
afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany();
  }
});

// Cleanup after all tests
afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongod.stop();
});

// Global test utilities
global.testUtils = {
  // Helper to create test user data
  createTestUser: () => ({
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
    phone: '1234567890'
  }),

  // Helper to create test product data
  createTestProduct: () => ({
    name: 'Test Product',
    description: 'Test product description',
    price: 99.99,
    category: 'Electronics',
    stock: 10,
    images: ['https://example.com/image1.jpg']
  }),

  // Helper to create test order data
  createTestOrder: (userId, products) => ({
    user: userId,
    products: products || [],
    shippingAddress: {
      address: '123 Test St',
      city: 'Test City',
      state: 'Test State',
      country: 'Test Country',
      zipCode: '12345'
    },
    paymentMethod: 'card',
    totalAmount: 99.99
  })
};



