

// Import required modules
const express = require('express');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware setup
app.use(bodyParser.json());

// Custom Middleware

// 1. Logger Middleware
const loggerMiddleware = (req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);
  next();
};

// 2. Authentication Middleware
const authMiddleware = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  // For demo purposes, using a hardcoded API key
  // In production, this should be in environment variables
  const validApiKey = 'secret-api-key-123';
  
  if (!apiKey) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Please provide an API key in the X-API-Key header'
    });
  }
  
  if (apiKey !== validApiKey) {
    return res.status(401).json({
      error: 'Invalid API key',
      message: 'The provided API key is invalid'
    });
  }
  
  next();
};

// 3. Validation Middleware for Product Creation/Update
const validateProduct = (req, res, next) => {
  const { name, description, price, category } = req.body;
  const errors = [];
  
  // Validation for POST requests (creation)
  if (req.method === 'POST') {
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      errors.push('Name is required and must be a non-empty string');
    }
    
    if (!description || typeof description !== 'string' || description.trim().length === 0) {
      errors.push('Description is required and must be a non-empty string');
    }
    
    if (price === undefined || isNaN(parseFloat(price)) || parseFloat(price) < 0) {
      errors.push('Price is required and must be a non-negative number');
    }
    
    if (!category || typeof category !== 'string' || category.trim().length === 0) {
      errors.push('Category is required and must be a non-empty string');
    }
  }
  
  // Validation for PUT requests (update) - fields are optional but must be valid if provided
  if (req.method === 'PUT') {
    if (name !== undefined && (typeof name !== 'string' || name.trim().length === 0)) {
      errors.push('Name must be a non-empty string');
    }
    
    if (description !== undefined && (typeof description !== 'string' || description.trim().length === 0)) {
      errors.push('Description must be a non-empty string');
    }
    
    if (price !== undefined && (isNaN(parseFloat(price)) || parseFloat(price) < 0)) {
      errors.push('Price must be a non-negative number');
    }
    
    if (category !== undefined && (typeof category !== 'string' || category.trim().length === 0)) {
      errors.push('Category must be a non-empty string');
    }
  }
  
  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors
    });
  }
  
  next();
};

// Apply logger middleware to all routes
app.use(loggerMiddleware);

// Sample in-memory products database
let products = [
  {
    id: '1',
    name: 'Laptop',
    description: 'High-performance laptop with 16GB RAM',
    price: 1200,
    category: 'electronics',
    inStock: true
  },
  {
    id: '2',
    name: 'Smartphone',
    description: 'Latest model with 128GB storage',
    price: 800,
    category: 'electronics',
    inStock: true
  },
  {
    id: '3',
    name: 'Coffee Maker',
    description: 'Programmable coffee maker with timer',
    price: 50,
    category: 'kitchen',
    inStock: false
  },
  {
    id: '4',
    name: 'Desk Chair',
    description: 'Ergonomic office chair',
    price: 150,
    category: 'furniture',
    inStock: true
  },
  {
    id: '5',
    name: 'Bookshelf',
    description: '5-tier wooden bookshelf',
    price: 80,
    category: 'furniture',
    inStock: false
  }
];

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Welcome to the Product API!',
    endpoints: {
      getAllProducts: 'GET /api/products',
      getProduct: 'GET /api/products/:id',
      createProduct: 'POST /api/products (requires X-API-Key header)',
      updateProduct: 'PUT /api/products/:id (requires X-API-Key header)',
      deleteProduct: 'DELETE /api/products/:id (requires X-API-Key header)',
      searchProducts: 'GET /api/products/search?q=term',
      getStats: 'GET /api/products/stats'
    }
  });
});

// GET /api/products - Get all products with filtering and pagination
app.get('/api/products', (req, res) => {
  let filteredProducts = [...products];
  
  // Filter by category
  if (req.query.category) {
    filteredProducts = filteredProducts.filter(
      product => product.category.toLowerCase() === req.query.category.toLowerCase()
    );
  }
  
  // Filter by inStock status
  if (req.query.inStock) {
    const inStock = req.query.inStock.toLowerCase() === 'true';
    filteredProducts = filteredProducts.filter(product => product.inStock === inStock);
  }
  
  // Filter by max price
  if (req.query.maxPrice) {
    const maxPrice = parseFloat(req.query.maxPrice);
    if (!isNaN(maxPrice)) {
      filteredProducts = filteredProducts.filter(product => product.price <= maxPrice);
    }
  }
  
  // Filter by min price
  if (req.query.minPrice) {
    const minPrice = parseFloat(req.query.minPrice);
    if (!isNaN(minPrice)) {
      filteredProducts = filteredProducts.filter(product => product.price >= minPrice);
    }
  }
  
  // Pagination
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  
  const result = {
    page,
    limit,
    total: filteredProducts.length,
    totalPages: Math.ceil(filteredProducts.length / limit),
    data: filteredProducts.slice(startIndex, endIndex)
  };
  
  res.json(result);
});

// GET /api/products/search - Search products by name or description
app.get('/api/products/search', (req, res) => {
  const searchTerm = req.query.q;
  
  if (!searchTerm) {
    return res.status(400).json({
      error: 'Search term required',
      message: 'Please provide a search term using the "q" query parameter'
    });
  }
  
  const searchResults = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  res.json({
    searchTerm,
    count: searchResults.length,
    data: searchResults
  });
});

// GET /api/products/stats - Get product statistics
app.get('/api/products/stats', (req, res) => {
  const stats = {
    totalProducts: products.length,
    inStock: products.filter(p => p.inStock).length,
    outOfStock: products.filter(p => !p.inStock).length,
    categories: {},
    priceRange: {
      min: 0,
      max: 0,
      average: 0
    }
  };
  
  // Calculate category counts
  products.forEach(product => {
    if (!stats.categories[product.category]) {
      stats.categories[product.category] = 0;
    }
    stats.categories[product.category]++;
  });
  
  // Calculate price statistics
  if (products.length > 0) {
    const prices = products.map(p => p.price);
    stats.priceRange.min = Math.min(...prices);
    stats.priceRange.max = Math.max(...prices);
    stats.priceRange.average = prices.reduce((sum, price) => sum + price, 0) / products.length;
  }
  
  res.json(stats);
});

// GET /api/products/:id - Get a specific product
app.get('/api/products/:id', (req, res) => {
  const product = products.find(p => p.id === req.params.id);
  
  if (!product) {
    return res.status(404).json({
      error: 'Product not found',
      message: `Product with ID ${req.params.id} does not exist`
    });
  }
  
  res.json(product);
});

// POST /api/products - Create a new product (protected)
app.post('/api/products', authMiddleware, validateProduct, (req, res) => {
  const { name, description, price, category, inStock = true } = req.body;
  
  const newProduct = {
    id: uuidv4(),
    name: name.trim(),
    description: description.trim(),
    price: parseFloat(price),
    category: category.trim(),
    inStock: Boolean(inStock)
  };
  
  products.push(newProduct);
  
  res.status(201).json({
    message: 'Product created successfully',
    product: newProduct
  });
});

// PUT /api/products/:id - Update a product (protected)
app.put('/api/products/:id', authMiddleware, validateProduct, (req, res) => {
  const productIndex = products.findIndex(p => p.id === req.params.id);
  
  if (productIndex === -1) {
    return res.status(404).json({
      error: 'Product not found',
      message: `Product with ID ${req.params.id} does not exist`
    });
  }
  
  const { name, description, price, category, inStock } = req.body;
  
  // Update only provided fields
  const updatedProduct = {
    ...products[productIndex],
    ...(name !== undefined && { name: name.trim() }),
    ...(description !== undefined && { description: description.trim() }),
    ...(price !== undefined && { price: parseFloat(price) }),
    ...(category !== undefined && { category: category.trim() }),
    ...(inStock !== undefined && { inStock: Boolean(inStock) })
  };
  
  products[productIndex] = updatedProduct;
  
  res.json({
    message: 'Product updated successfully',
    product: updatedProduct
  });
});

// DELETE /api/products/:id - Delete a product (protected)
app.delete('/api/products/:id', authMiddleware, (req, res) => {
  const productIndex = products.findIndex(p => p.id === req.params.id);
  
  if (productIndex === -1) {
    return res.status(404).json({
      error: 'Product not found',
      message: `Product with ID ${req.params.id} does not exist`
    });
  }
  
  const deletedProduct = products.splice(productIndex, 1)[0];
  
  res.json({
    message: 'Product deleted successfully',
    product: deletedProduct
  });
});

// 404 Handler for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `The route ${req.originalUrl} does not exist on this server`
  });
});

// Global Error Handling Middleware
app.use((error, req, res, next) => {
  console.error('Error:', error);
  
  res.status(500).json({
    error: 'Internal server error',
    message: 'Something went wrong on the server'
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log('Available endpoints:');
  console.log('  GET  /api/products - Get all products');
  console.log('  GET  /api/products/:id - Get specific product');
  console.log('  POST /api/products - Create product (requires X-API-Key)');
  console.log('  PUT  /api/products/:id - Update product (requires X-API-Key)');
  console.log('  DELETE /api/products/:id - Delete product (requires X-API-Key)');
  console.log('  GET  /api/products/search?q=term - Search products');
  console.log('  GET  /api/products/stats - Get statistics');
  console.log('\nUse X-API-Key: "secret-api-key-123" for protected routes');
});

// Export the app for testing purposes
module.exports = app;
