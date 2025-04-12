/**
 * Error handling middleware
 */
const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);

    // Check if headers have already been sent
    if (res.headersSent) {
        return next(err);
    }

    // Database connection errors
    if (err.code && (err.code === 'ECONNREFUSED' || err.code === 'ER_ACCESS_DENIED_ERROR')) {
        return res.status(503).json({
            success: false,
            error: 'Database connection error',
            message: 'Unable to connect to the database'
        });
    }

    // JWT authentication errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            error: 'Invalid token',
            message: 'Authentication failed'
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            error: 'Token expired',
            message: 'Please login again'
        });
    }

    // Handle MySQL specific errors
    if (err.errno) {
        if (err.errno === 1062) { // Duplicate entry
            return res.status(409).json({
                success: false,
                error: 'Duplicate entry',
                message: 'Record already exists'
            });
        }

        if (err.errno === 1451) { // Foreign key constraint
            return res.status(409).json({
                success: false,
                error: 'Foreign key constraint',
                message: 'Cannot delete or update record because it is referenced by other records'
            });
        }
    }

    // Default error response
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal server error';

    res.status(statusCode).json({
        success: false,
        error: message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

module.exports = errorHandler;
