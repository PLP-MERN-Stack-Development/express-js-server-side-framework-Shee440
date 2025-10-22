const authMiddleware = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  
  const validApiKey = process.env.API_KEY || 'secret-key-123';
  
  if (!apiKey || apiKey !== validApiKey) {
    const error = new Error('Unauthorized');
    error.name = 'UnauthorizedError';
    return next(error);
  }
  
  next();
};

module.exports = authMiddleware;