const xss = require('xss');

/**
 * Sanitize user input to prevent XSS attacks
 */
const sanitizeValue = (value) => {
    if (typeof value === 'string') {
        return xss(value.trim(), {
            whiteList: {}, // No HTML tags allowed
            stripIgnoreTag: true,
            stripIgnoreTagBody: ['script', 'style', 'iframe', 'object', 'embed']
        });
    }
    if (Array.isArray(value)) {
        return value.map(sanitizeValue);
    }
    if (value && typeof value === 'object') {
        const sanitized = {};
        for (const [key, val] of Object.entries(value)) {
            sanitized[key] = sanitizeValue(val);
        }
        return sanitized;
    }
    return value;
};

/**
 * Middleware to sanitize all incoming request data
 */
const sanitizeInput = (req, res, next) => {
    if (req.body) {
        req.body = sanitizeValue(req.body);
    }
    if (req.query) {
        req.query = sanitizeValue(req.query);
    }
    if (req.params) {
        req.params = sanitizeValue(req.params);
    }
    next();
};

/**
 * Validate and sanitize specific fields
 */
const sanitizeField = (field) => {
    return (req, res, next) => {
        if (req.body[field]) {
            req.body[field] = sanitizeValue(req.body[field]);
        }
        next();
    };
};

module.exports = { sanitizeInput, sanitizeField, sanitizeValue };