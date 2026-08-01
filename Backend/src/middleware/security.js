const helmet = require('helmet')
const crypto = require('crypto')

// Content Security Policy
const cspConfig = {
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", "data:", "https:", "blob:"],
    connectSrc: ["'self'", "ws:", "wss:"],
    fontSrc: ["'self'", "data:"],
    objectSrc: ["'none'"],
    mediaSrc: ["'self'"],
    frameSrc: ["'none'"],
    formAction: ["'self'"],
    baseUri: ["'self'"],
    manifestSrc: ["'self'"]
  },
  reportOnly: process.env.NODE_ENV === 'production' ? false : true
}

// CSRF Protection
const csrfProtection = (req, res, next) => {
  // Skip CSRF for API routes with JWT
  if (req.path.startsWith('/api/') && req.headers.authorization) {
    return next()
  }

  // Skip CSRF for GET, HEAD, OPTIONS
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next()
  }

  const token = req.headers['x-csrf-token'] || req.body._csrf
  const sessionToken = req.session?.csrfToken

  if (!token || !sessionToken || token !== sessionToken) {
    return res.status(403).json({ message: 'Invalid CSRF token' })
  }

  next()
}

// Generate CSRF token
const generateCsrfToken = (req, res, next) => {
  if (!req.session) {
    return next()
  }

  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(32).toString('hex')
  }

  res.locals.csrfToken = req.session.csrfToken
  next()
}

// Secure headers middleware
const securityHeaders = (req, res, next) => {
  // Remove X-Powered-By
  res.removeHeader('X-Powered-By')

  // Add security headers
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'SAMEORIGIN')
  res.setHeader('X-XSS-Protection', '1; mode=block')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')

  // HSTS for production
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  }

  next()
}

// File upload security
const validateFileUpload = (req, res, next) => {
  if (!req.file && !req.files) {
    return next()
  }

  const files = req.files || [req.file]
  
  for (const file of files) {
    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      return res.status(400).json({ message: 'File size exceeds maximum limit of 5MB' })
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
    if (!allowedTypes.includes(file.mimetype)) {
      return res.status(400).json({ message: 'Invalid file type. Allowed: JPEG, PNG, GIF, WebP, PDF' })
    }

    // Check file extension
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf']
    const extension = file.originalname.toLowerCase().match(/\.[^.]+$/)?.[0]
    if (!extension || !allowedExtensions.includes(extension)) {
      return res.status(400).json({ message: 'Invalid file extension' })
    }
  }

  next()
}

// Environment validation
const validateEnvironment = () => {
  // Skip validation in test mode
  if (process.env.NODE_ENV === 'test') {
    // Set defaults for test mode
    if (!process.env.JWT_SECRET) process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only-32chars!'
    if (!process.env.JWT_REFRESH_SECRET) process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-for-testing-only-32chars!'
    if (!process.env.CORS_ORIGIN) process.env.CORS_ORIGIN = 'http://localhost:3000'
    if (!process.env.PORT) process.env.PORT = 5000
    if (!process.env.NODE_ENV) process.env.NODE_ENV = 'test'
    return
  }

  // In development, set defaults if not provided
  if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
    if (!process.env.JWT_SECRET) process.env.JWT_SECRET = 'dev-jwt-secret-not-for-production-use-32+'
    if (!process.env.JWT_REFRESH_SECRET) process.env.JWT_REFRESH_SECRET = 'dev-refresh-secret-not-for-production-32+'
    if (!process.env.CORS_ORIGIN) process.env.CORS_ORIGIN = 'http://localhost:3000'
    if (!process.env.PORT) process.env.PORT = 5000
    if (!process.env.NODE_ENV) process.env.NODE_ENV = 'development'
    console.warn('Running in development mode with default secrets - DO NOT use in production!')
    return
  }

  // Production: strict validation
  const required = [
    'NODE_ENV',
    'PORT',
    'DATABASE_URL',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'CORS_ORIGIN'
  ]

  const missing = required.filter(key => !process.env[key])

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }

  // Validate JWT secrets
  if (process.env.JWT_SECRET?.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long')
  }

  if (process.env.JWT_REFRESH_SECRET?.length < 32) {
    throw new Error('JWT_REFRESH_SECRET must be at least 32 characters long')
  }

  // Validate database URL
  if (!process.env.DATABASE_URL?.startsWith('postgresql://')) {
    throw new Error('DATABASE_URL must be a valid PostgreSQL connection string')
  }
}

module.exports = {
  helmet,
  cspConfig,
  csrfProtection,
  generateCsrfToken,
  securityHeaders,
  validateFileUpload,
  validateEnvironment
}