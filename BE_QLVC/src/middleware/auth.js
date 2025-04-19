const jwt = require('jsonwebtoken');

/**
 * Authentication middleware to protect routes
 * Verifies JWT token from Authorization header
 */
const authMiddleware = (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required. No token provided.' });
    }

    // Extract the token
    const token = authHeader.split(' ')[1];
      // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY || 'your_jwt_secret_key');
    
    // Add user data to request
    req.user = decoded;
    
    // Proceed to the protected route
    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

module.exports = authMiddleware;
