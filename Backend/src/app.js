const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();
const pool = require('./db/pool');
const errorHandler = require('./middleware/errorHandler');
const { rateLimiter, authLimiter, apiLimiter } = require('./middleware/rateLimiter');
const { authenticateToken } = require('./middleware/auth');
const { requireAdmin } = require('./middleware/adminAuth');
const { sanitizeInput } = require('./middleware/sanitize');
const { validateEnvironment } = require('./middleware/security');
const setupSocketIO = require('./sockets');
const EmailQueue = require('./services/emailQueue');
const { connectRedis, cache } = require('./services/redis');
const { initSentry, captureException, captureMessage, setUser, addBreadcrumb } = require('./services/sentry');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:3000',
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
        credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000
});

// Security middleware
app.use(helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
    crossOriginEmbedderPolicy: false
}));
app.use(compression());

// CORS configuration
const corsOptions = {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token'],
    exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining']
};
app.use(cors(corsOptions));

// Webhook routes MUST be mounted BEFORE global express.json() body parser
// because Stripe requires raw body for signature verification
const webhookRoutes = require('./routes/webhook');
app.use('/api/webhooks', webhookRoutes);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Trust proxy for rate limiting behind reverse proxy
app.set('trust proxy', 1);

// Global middleware
app.use('/api', rateLimiter);
app.use('/api', sanitizeInput);

// Request logging middleware
app.use('/api', (req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        if (res.statusCode >= 400) {
            console.warn(`[${req.method}] ${req.path} - ${res.statusCode} (${duration}ms)`);
        }
    });
    next();
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW() as current_time');
        res.json({ 
            status: 'ok', 
            message: 'Server is running!',
            database: 'connected',
            timestamp: result.rows[0].current_time,
            uptime: process.uptime(),
            environment: process.env.NODE_ENV || 'development'
        });
    } catch (error) {
        res.status(500).json({ 
            status: 'error', 
            message: 'Database connection failed',
            timestamp: new Date().toISOString()
        });
    }
});

// Routes
const authRoutes = require('./routes/auth');
const boardRoutes = require('./routes/boards');
const listRoutes = require('./routes/lists');
const cardRoutes = require('./routes/cards');
const paymentRoutes = require('./routes/payments');
const userRoutes = require('./routes/users');
const searchRoutes = require('./routes/search');
const notificationRoutes = require('./routes/notifications');
const adminRoutes = require('./routes/admin');
const auditRoutes = require('./routes/audit');
const emailRoutes = require('./routes/email');

// Public routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/health', rateLimiter);

// Authenticated routes
app.use('/api/boards', authenticateToken, boardRoutes);
app.use('/api/lists', authenticateToken, listRoutes);
app.use('/api/cards', authenticateToken, cardRoutes);
app.use('/api/payments', authenticateToken, paymentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/search', authenticateToken, searchRoutes);
app.use('/api/notifications', authenticateToken, notificationRoutes);

// Admin routes (require admin privileges)
app.use('/api/admin', authenticateToken, requireAdmin, adminRoutes);

// Protected routes
app.use('/api/audit', authenticateToken, requireAdmin, auditRoutes);
app.use('/api/email', authenticateToken, requireAdmin, emailRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({ 
        error: 'Route not found', 
        message: `Route ${req.method} ${req.path} not found`,
        path: req.path,
        method: req.method
    });
});

// Error handler
app.use(errorHandler);

// Initialize services
async function initializeServices() {
    try {
        // Validate environment variables
        validateEnvironment();
        console.log('Environment validation passed');

        // Connect to Redis
        await connectRedis();
        console.log('Redis connected');

        // Initialize Sentry
        initSentry();
        
        console.log('All services initialized successfully');
    } catch (error) {
        console.error('Failed to initialize services:', error);
        // Continue without optional services
    }
}

// Initialize services before starting server
initializeServices();

// Setup Socket.io
setupSocketIO(io);

// Make io accessible to routes
app.set('io', io);

// Start email queue processor
setInterval(async () => {
    try {
        await EmailQueue.processQueue();
    } catch (err) {
        console.error('Email queue processor error:', err);
        captureException(err, { context: 'emailQueue' });
    }
}, 30000);

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM signal received: closing HTTP server');
    httpServer.close(() => {
        console.log('HTTP server closed');
    });
    
    // Disconnect Redis
    const { disconnect } = require('./services/redis');
    await disconnect();
    
    // Flush Sentry events
    const { flush } = require('./services/sentry');
    await flush();
    
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('SIGINT signal received: closing HTTP server');
    httpServer.close(() => {
        console.log('HTTP server closed');
    });
    
    // Disconnect Redis
    const { disconnect } = require('./services/redis');
    await disconnect();
    
    // Flush Sentry events
    const { flush } = require('./services/sentry');
    await flush();
    
    process.exit(0);
});

module.exports = { app, httpServer, io };
