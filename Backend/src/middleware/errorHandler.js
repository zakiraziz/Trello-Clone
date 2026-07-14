const errorHandler = (err, req, res, next) => {
    console.error('❌ Error:', err.stack);

    let statusCode = 500;
    let message = 'Something went wrong!';
    let details = process.env.NODE_ENV === 'development' ? err.message : undefined;

    if (err.code) {
        switch (err.code) {
            case '23505':
                statusCode = 409;
                message = 'Duplicate entry found';
                break;
            case '23503':
                statusCode = 400;
                message = 'Referenced record does not exist';
                break;
            case '42P01':
                statusCode = 500;
                message = 'Database configuration error';
                break;
            case '23502':
                statusCode = 400;
                message = 'Required field missing';
                break;
        }
    }

    if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid authentication token';
    }

    if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Authentication token expired';
    }

    res.status(statusCode).json({
        error: message,
        details,
        status: statusCode,
        timestamp: new Date().toISOString()
    });
};

module.exports = errorHandler;