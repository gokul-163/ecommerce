# Product API Testing Guide

This guide shows you how to test your product endpoints and send data to your backend API.

## 🚀 Quick Start

### 1. Start Your Backend Server
```bash
npm run server
# or
node server.js
```

### 2. Run the Product API Tester
```bash
node product-api-tester.js
```

### 3. Import Postman Collection
Import `postman-collection.json` into Postman for manual testing.

## 📦 Test Data Overview

The `product-test-data.json` file contains:

### Products (10 items)
- **Electronics**: iPhone 15 Pro, Samsung Galaxy S24, MacBook Pro, Sony Headphones, Canon Camera, iPad Air
- **Sports**: Nike Air Max, Adidas Ultraboost, Under Armour Shirt, Garmin Watch

### Categories (5 items)
- Electronics, Sports, Clothing, Home & Garden, Books

## 🧪 Testing Methods

### Method 1: Automated Testing Script

#### Run Complete Test Suite
```bash
node product-api-tester.js
```

This will:
1. ✅ Authenticate as admin user
2. ✅ Create all 10 products from test data
3. ✅ Test all CRUD operations
4. ✅ Test search and filtering
5. ✅ Test sorting and pagination
6. ✅ Generate test report

#### Test Output Example
```
🚀 Starting Product API Tests...

✅ Loaded 10 products from test data
🔐 Authenticating as admin...
✅ Admin user registered and authenticated

📦 Testing Product Creation...
✅ Created product: iPhone 15 Pro (ID: 507f1f77bcf86cd799439011)
✅ Created product: Samsung Galaxy S24 Ultra (ID: 507f1f77bcf86cd799439012)
...

📋 Testing Get All Products...
✅ Retrieved 10 products
📊 Total products: 10
📄 Current page: 1
📄 Total pages: 1

🔍 Testing Get Product by ID...
✅ Retrieved product: iPhone 15 Pro
💰 Price: $999.99
📦 Stock: 25
🏷️ Category: Electronics

🔎 Testing Product Search...
✅ Search for "iPhone": Found 1 products
   - iPhone 15 Pro ($999.99)
✅ Search for "Nike": Found 1 products
   - Nike Air Max 270 ($129.99)

🎉 All Product API Tests Completed!
📊 Test report saved to: product-test-report.json
```

### Method 2: Manual Testing with Postman

#### 1. Import Collection
1. Open Postman
2. Click "Import"
3. Select `postman-collection.json`
4. Set environment variables:
   - `baseUrl`: `http://localhost:5001/api`
   - `authToken`: (will be set automatically)
   - `productId`: (will be set automatically)

#### 2. Authentication Flow
1. Run "Register Admin User" - this sets the auth token
2. Or run "Login Admin User" if user already exists

#### 3. Test Product Operations
1. **Create Products**: Run the create product requests
2. **Get All Products**: Test pagination and filtering
3. **Search & Filter**: Test different search terms and categories
4. **Update Product**: Modify existing products
5. **Delete Product**: Remove products

### Method 3: Direct API Calls

#### Create a Product
```bash
curl -X POST http://localhost:5001/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Test Product",
    "description": "A test product",
    "price": 99.99,
    "category": "Electronics",
    "stock": 10,
    "images": ["https://example.com/image.jpg"]
  }'
```

#### Get All Products
```bash
curl http://localhost:5001/api/products
```

#### Search Products
```bash
curl "http://localhost:5001/api/products?search=iPhone&category=Electronics"
```

## 📊 API Endpoints Reference

### Product Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/products` | Create product | ✅ Admin |
| GET | `/api/products` | Get all products | ❌ |
| GET | `/api/products/:id` | Get product by ID | ❌ |
| PUT | `/api/products/:id` | Update product | ✅ Admin |
| DELETE | `/api/products/:id` | Delete product | ✅ Admin |
| GET | `/api/products/categories` | Get categories | ❌ |

### Query Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `search` | string | Search by name/description | `?search=iPhone` |
| `category` | string | Filter by category | `?category=Electronics` |
| `sort` | string | Sort field (name, price, etc.) | `?sort=price` |
| `order` | string | Sort order (asc, desc) | `?order=desc` |
| `page` | number | Page number | `?page=1` |
| `limit` | number | Items per page | `?limit=10` |
| `minPrice` | number | Minimum price filter | `?minPrice=100` |
| `maxPrice` | number | Maximum price filter | `?maxPrice=1000` |

## 📋 Sample Product Data Structure

```json
{
  "name": "iPhone 15 Pro",
  "description": "Latest iPhone with A17 Pro chip",
  "price": 999.99,
  "category": "Electronics",
  "stock": 25,
  "images": [
    "https://example.com/iphone15pro-1.jpg",
    "https://example.com/iphone15pro-2.jpg"
  ],
  "specifications": {
    "color": "Natural Titanium",
    "storage": "128GB",
    "screen": "6.1 inch Super Retina XDR",
    "camera": "48MP Main + 12MP Ultra Wide + 12MP Telephoto"
  },
  "tags": ["smartphone", "apple", "5g", "camera"],
  "rating": 4.8,
  "reviews": 156
}
```

## 🔍 Testing Scenarios

### 1. Basic CRUD Operations
- ✅ Create product with all fields
- ✅ Create product with minimal fields
- ✅ Get product by ID
- ✅ Update product fields
- ✅ Delete product
- ✅ Verify deletion

### 2. Search and Filtering
- ✅ Search by product name
- ✅ Search by description
- ✅ Filter by category
- ✅ Filter by price range
- ✅ Combined search and filter

### 3. Sorting and Pagination
- ✅ Sort by price (asc/desc)
- ✅ Sort by name (asc/desc)
- ✅ Pagination with different limits
- ✅ Combined sorting and pagination

### 4. Error Handling
- ✅ Invalid product ID
- ✅ Missing required fields
- ✅ Unauthorized access
- ✅ Invalid category
- ✅ Negative price/stock

### 5. Performance Testing
- ✅ Large number of products
- ✅ Complex search queries
- ✅ Multiple concurrent requests

## 🚨 Common Issues & Solutions

### 1. Authentication Errors
**Problem**: 401 Unauthorized
**Solution**: 
- Ensure you're logged in as admin
- Check token expiration
- Verify Authorization header format

### 2. Validation Errors
**Problem**: 400 Bad Request
**Solution**:
- Check required fields (name, price, category)
- Ensure price is positive number
- Verify category exists

### 3. Product Not Found
**Problem**: 404 Not Found
**Solution**:
- Verify product ID is correct
- Check if product was deleted
- Ensure product exists in database

### 4. Server Connection Issues
**Problem**: Connection refused
**Solution**:
- Ensure backend server is running
- Check port configuration (default: 5001)
- Verify firewall settings

## 📈 Performance Tips

### 1. Database Indexing
Ensure your MongoDB has indexes on:
- `name` (for search)
- `category` (for filtering)
- `price` (for sorting)
- `createdAt` (for pagination)

### 2. Query Optimization
- Use pagination for large datasets
- Limit search results
- Cache frequently accessed data
- Use database aggregation for complex queries

### 3. API Optimization
- Implement response compression
- Use proper HTTP status codes
- Add response caching headers
- Optimize database queries

## 🎯 Success Criteria

Your product API is working correctly when:

- ✅ All CRUD operations work
- ✅ Search and filtering return correct results
- ✅ Sorting works for all fields
- ✅ Pagination handles large datasets
- ✅ Error handling is proper
- ✅ Authentication/authorization works
- ✅ Response times are acceptable (< 500ms)
- ✅ Data validation prevents invalid input

## 📞 Troubleshooting

### Debug Mode
```bash
# Run with verbose logging
DEBUG=* node product-api-tester.js

# Test specific endpoint
curl -v http://localhost:5001/api/products
```

### Database Issues
```bash
# Check MongoDB connection
mongo your-database-name
db.products.find().limit(5)
```

### Server Logs
```bash
# Check server logs
tail -f server.log
```

## 🎉 Next Steps

1. **Test with Real Data**: Replace example URLs with real product images
2. **Add More Categories**: Expand product categories
3. **Implement Advanced Features**: 
   - Product variants (size, color)
   - Inventory management
   - Product reviews
   - Related products
4. **Performance Testing**: Load test with thousands of products
5. **Security Testing**: Test authorization and input validation

## 📚 Additional Resources

- [MongoDB Query Documentation](https://docs.mongodb.com/manual/reference/operator/query/)
- [Express.js API Best Practices](https://expressjs.com/en/advanced/best-practices-performance.html)
- [REST API Design Guidelines](https://restfulapi.net/)
- [JWT Authentication](https://jwt.io/introduction/)



