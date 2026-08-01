const rateLimit = require('express-rate-limit');

const rateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: process.env.NODE_ENV === 'test' ? 1000 : 100,
    message: {
        error: 'Too many requests',
        message: 'Please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.user?.id || req.ip
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: process.env.NODE_ENV === 'test' ? 1000 : 10,
    message: {
        error: 'Too many authentication attempts',
        message: 'Please try again later'
    }
});

const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: process.env.NODE_ENV === 'test' ? 1000 : 60,
    message: {
        error: 'Too many API requests',
        message: 'Please slow down'
    },
    standardHeaders: true,
    legacyHeaders: false
});

module.exports = { rateLimiter, authLimiter, apiLimiter };