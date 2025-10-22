const { ValidationError } = require('../errors/customErrors');

const validationMiddleware = (req, res, next) => {
  const { method, body } = req;
  
  if (method === 'POST' || method === 'PUT') {
    const { name, description, price, category } = body;
    
    const errors = [];
    
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
    
    if (errors.length > 0) {
      throw new ValidationError(`Validation failed: ${errors.join(', ')}`);
    }
  }
  
  next();
};

module.exports = validationMiddleware;