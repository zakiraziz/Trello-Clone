const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();
const pool = require('./db/pool');
const errorHandler = require('./middleware/errorHandler');
const { rateLimiter, authLimiter } = require('./middleware/rateLimiter');
const { authenticateToken } = require('./middleware/auth');
const setupSocketIO = require('./sockets');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:3000',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: true
    }
});

app.use(helmet());
app.use(compression());
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/api', rateLimiter);

app.get('/api/health', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW() as current_time');
        res.json({ 
            status: 'ok', 
            message: 'Server is running!',
            database: 'connected',
            timestamp: result.rows[0].current_time
        });
    } catch (error) {
        res.status(500).json({ 
            status: 'error', 
            message: 'Database connection failed'
        });
    }
});

const authRoutes = require('./routes/auth');
const boardRoutes = require('./routes/boards');
const listRoutes = require('./routes/lists');
const cardRoutes = require('./routes/cards');
const paymentRoutes = require('./routes/payments');

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/boards', authenticateToken, boardRoutes);
app.use('/api/lists', authenticateToken, listRoutes);
app.use('/api/cards', authenticateToken, cardRoutes);
app.use('/api/payments', authenticateToken, paymentRoutes);

app.use((req, res) => {
    res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

app.use(errorHandler);
setupSocketIO(io);

module.exports = { app, httpServer, io };