const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
const API_BASE_URL = 'http://localhost:5001/api';
const TEST_DATA_FILE = 'product-test-data.json';

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

class ProductAPITester {
  constructor() {
    this.authToken = null;
    this.testData = null;
    this.createdProducts = [];
  }

  // Load test data
  loadTestData() {
    try {
      const data = fs.readFileSync(TEST_DATA_FILE, 'utf8');
      this.testData = JSON.parse(data);
      log(`✅ Loaded ${this.testData.products.length} products from test data`, 'green');
    } catch (error) {
      log(`❌ Error loading test data: ${error.message}`, 'red');
      process.exit(1);
    }
  }

  // Authentication
  async authenticate() {
    try {
      log('🔐 Authenticating as admin...', 'blue');
      
      // First, try to register an admin user
      const registerResponse = await axios.post(`${API_BASE_URL}/auth/register`, {
        name: 'Admin User',
        email: 'admin@test.com',
        password: 'admin123',
        role: 'admin'
      });

      this.authToken = registerResponse.data.token;
      log('✅ Admin user registered and authenticated', 'green');
    } catch (error) {
      if (error.response?.status === 400 && error.response.data.message.includes('already exists')) {
        // User already exists, try to login
        try {
          const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
            email: 'admin@test.com',
            password: 'admin123'
          });
          this.authToken = loginResponse.data.token;
          log('✅ Admin user logged in', 'green');
        } catch (loginError) {
          log(`❌ Login failed: ${loginError.response?.data?.message || loginError.message}`, 'red');
          process.exit(1);
        }
      } else {
        log(`❌ Authentication failed: ${error.response?.data?.message || error.message}`, 'red');
        process.exit(1);
      }
    }
  }

  // Test product creation
  async testCreateProducts() {
    log('\n📦 Testing Product Creation...', 'bold');
    
    for (let i = 0; i < this.testData.products.length; i++) {
      const product = this.testData.products[i];
      
      try {
        const response = await axios.post(`${API_BASE_URL}/products`, product, {
          headers: {
            'Authorization': `Bearer ${this.authToken}`,
            'Content-Type': 'application/json'
          }
        });

        this.createdProducts.push(response.data);
        log(`✅ Created product: ${product.name} (ID: ${response.data._id})`, 'green');
        
        // Add a small delay to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        log(`❌ Failed to create product ${product.name}: ${error.response?.data?.message || error.message}`, 'red');
      }
    }
  }

  // Test get all products
  async testGetAllProducts() {
    log('\n📋 Testing Get All Products...', 'bold');
    
    try {
      const response = await axios.get(`${API_BASE_URL}/products`);
      
      log(`✅ Retrieved ${response.data.products.length} products`, 'green');
      log(`📊 Total products: ${response.data.totalProducts}`, 'blue');
      log(`📄 Current page: ${response.data.currentPage}`, 'blue');
      log(`📄 Total pages: ${response.data.totalPages}`, 'blue');
      
      return response.data;
    } catch (error) {
      log(`❌ Failed to get products: ${error.response?.data?.message || error.message}`, 'red');
      return null;
    }
  }

  // Test get product by ID
  async testGetProductById() {
    log('\n🔍 Testing Get Product by ID...', 'bold');
    
    if (this.createdProducts.length === 0) {
      log('⚠️  No products created yet, skipping this test', 'yellow');
      return;
    }

    const product = this.createdProducts[0];
    
    try {
      const response = await axios.get(`${API_BASE_URL}/products/${product._id}`);
      
      log(`✅ Retrieved product: ${response.data.name}`, 'green');
      log(`💰 Price: $${response.data.price}`, 'blue');
      log(`📦 Stock: ${response.data.stock}`, 'blue');
      log(`🏷️  Category: ${response.data.category}`, 'blue');
      
      return response.data;
    } catch (error) {
      log(`❌ Failed to get product by ID: ${error.response?.data?.message || error.message}`, 'red');
      return null;
    }
  }

  // Test product search
  async testProductSearch() {
    log('\n🔎 Testing Product Search...', 'bold');
    
    const searchTerms = ['iPhone', 'Nike', 'Sony', 'MacBook'];
    
    for (const term of searchTerms) {
      try {
        const response = await axios.get(`${API_BASE_URL}/products?search=${encodeURIComponent(term)}`);
        
        log(`✅ Search for "${term}": Found ${response.data.products.length} products`, 'green');
        
        if (response.data.products.length > 0) {
          response.data.products.forEach(product => {
            log(`   - ${product.name} ($${product.price})`, 'blue');
          });
        }
      } catch (error) {
        log(`❌ Search failed for "${term}": ${error.response?.data?.message || error.message}`, 'red');
      }
    }
  }

  // Test product filtering by category
  async testProductFiltering() {
    log('\n🏷️  Testing Product Filtering by Category...', 'bold');
    
    const categories = ['Electronics', 'Sports'];
    
    for (const category of categories) {
      try {
        const response = await axios.get(`${API_BASE_URL}/products?category=${encodeURIComponent(category)}`);
        
        log(`✅ Category "${category}": Found ${response.data.products.length} products`, 'green');
        
        if (response.data.products.length > 0) {
          response.data.products.forEach(product => {
            log(`   - ${product.name} ($${product.price})`, 'blue');
          });
        }
      } catch (error) {
        log(`❌ Category filter failed for "${category}": ${error.response?.data?.message || error.message}`, 'red');
      }
    }
  }

  // Test product sorting
  async testProductSorting() {
    log('\n📊 Testing Product Sorting...', 'bold');
    
    const sortOptions = [
      { field: 'price', order: 'asc', description: 'Price (Low to High)' },
      { field: 'price', order: 'desc', description: 'Price (High to Low)' },
      { field: 'name', order: 'asc', description: 'Name (A to Z)' },
      { field: 'name', order: 'desc', description: 'Name (Z to A)' }
    ];
    
    for (const option of sortOptions) {
      try {
        const response = await axios.get(`${API_BASE_URL}/products?sort=${option.field}&order=${option.order}`);
        
        log(`✅ ${option.description}: Retrieved ${response.data.products.length} products`, 'green');
        
        if (response.data.products.length > 0) {
          const firstProduct = response.data.products[0];
          const lastProduct = response.data.products[response.data.products.length - 1];
          
          if (option.field === 'price') {
            log(`   First: ${firstProduct.name} ($${firstProduct.price})`, 'blue');
            log(`   Last: ${lastProduct.name} ($${lastProduct.price})`, 'blue');
          } else {
            log(`   First: ${firstProduct.name}`, 'blue');
            log(`   Last: ${lastProduct.name}`, 'blue');
          }
        }
      } catch (error) {
        log(`❌ Sorting failed for ${option.description}: ${error.response?.data?.message || error.message}`, 'red');
      }
    }
  }

  // Test product pagination
  async testProductPagination() {
    log('\n📄 Testing Product Pagination...', 'bold');
    
    try {
      // Get first page with 3 items
      const response1 = await axios.get(`${API_BASE_URL}/products?page=1&limit=3`);
      log(`✅ Page 1 (limit=3): ${response1.data.products.length} products`, 'green');
      log(`   Total pages: ${response1.data.totalPages}`, 'blue');
      
      // Get second page
      if (response1.data.totalPages > 1) {
        const response2 = await axios.get(`${API_BASE_URL}/products?page=2&limit=3`);
        log(`✅ Page 2 (limit=3): ${response2.data.products.length} products`, 'green');
      }
      
      // Get all products (no pagination)
      const responseAll = await axios.get(`${API_BASE_URL}/products?limit=100`);
      log(`✅ All products: ${responseAll.data.products.length} products`, 'green');
      
    } catch (error) {
      log(`❌ Pagination test failed: ${error.response?.data?.message || error.message}`, 'red');
    }
  }

  // Test product update
  async testProductUpdate() {
    log('\n✏️  Testing Product Update...', 'bold');
    
    if (this.createdProducts.length === 0) {
      log('⚠️  No products created yet, skipping this test', 'yellow');
      return;
    }

    const product = this.createdProducts[0];
    const updateData = {
      name: `${product.name} (Updated)`,
      price: product.price + 10,
      stock: product.stock + 5
    };
    
    try {
      const response = await axios.put(`${API_BASE_URL}/products/${product._id}`, updateData, {
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      log(`✅ Updated product: ${response.data.name}`, 'green');
      log(`💰 New price: $${response.data.price}`, 'blue');
      log(`📦 New stock: ${response.data.stock}`, 'blue');
      
      return response.data;
    } catch (error) {
      log(`❌ Failed to update product: ${error.response?.data?.message || error.message}`, 'red');
      return null;
    }
  }

  // Test product deletion
  async testProductDeletion() {
    log('\n🗑️  Testing Product Deletion...', 'bold');
    
    if (this.createdProducts.length === 0) {
      log('⚠️  No products created yet, skipping this test', 'yellow');
      return;
    }

    const product = this.createdProducts[this.createdProducts.length - 1];
    
    try {
      await axios.delete(`${API_BASE_URL}/products/${product._id}`, {
        headers: {
          'Authorization': `Bearer ${this.authToken}`
        }
      });
      
      log(`✅ Deleted product: ${product.name}`, 'green');
      
      // Verify deletion
      try {
        await axios.get(`${API_BASE_URL}/products/${product._id}`);
        log(`❌ Product still exists after deletion`, 'red');
      } catch (error) {
        if (error.response?.status === 404) {
          log(`✅ Product successfully deleted (404 confirmed)`, 'green');
        }
      }
      
    } catch (error) {
      log(`❌ Failed to delete product: ${error.response?.data?.message || error.message}`, 'red');
    }
  }

  // Test categories endpoint
  async testCategories() {
    log('\n📂 Testing Categories Endpoint...', 'bold');
    
    try {
      const response = await axios.get(`${API_BASE_URL}/products/categories`);
      
      log(`✅ Retrieved ${response.data.categories.length} categories`, 'green');
      
      response.data.categories.forEach(category => {
        log(`   - ${category}`, 'blue');
      });
      
      return response.data;
    } catch (error) {
      log(`❌ Failed to get categories: ${error.response?.data?.message || error.message}`, 'red');
      return null;
    }
  }

  // Run all tests
  async runAllTests() {
    log('🚀 Starting Product API Tests...', 'bold');
    
    try {
      // Load test data
      this.loadTestData();
      
      // Authenticate
      await this.authenticate();
      
      // Run tests
      await this.testCreateProducts();
      await this.testGetAllProducts();
      await this.testGetProductById();
      await this.testProductSearch();
      await this.testProductFiltering();
      await this.testProductSorting();
      await this.testProductPagination();
      await this.testCategories();
      await this.testProductUpdate();
      await this.testProductDeletion();
      
      log('\n🎉 All Product API Tests Completed!', 'bold');
      
    } catch (error) {
      log(`❌ Test execution failed: ${error.message}`, 'red');
    }
  }

  // Generate test report
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      totalProductsCreated: this.createdProducts.length,
      products: this.createdProducts.map(p => ({
        id: p._id,
        name: p.name,
        price: p.price,
        category: p.category
      }))
    };

    const reportPath = 'product-test-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    log(`\n📊 Test report saved to: ${reportPath}`, 'blue');
  }
}

// Main execution
async function main() {
  const tester = new ProductAPITester();
  await tester.runAllTests();
  tester.generateReport();
}

// Handle command line arguments
const args = process.argv.slice(2);
const command = args[0];

if (command === 'help') {
  log('Product API Tester Usage:', 'bold');
  log('node product-api-tester.js          - Run all tests', 'blue');
  log('node product-api-tester.js help     - Show this help', 'blue');
} else {
  main().catch(console.error);
}



