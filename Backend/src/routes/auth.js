const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pool = require('../db/pool');
const { validateRegistration, validateLogin } = require('../middleware/validation');
const { sendEmail } = require('../services/emailService');
const EmailQueue = require('../services/emailQueue');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

const sendAdminNotification = async (subject, message, data = {}) => {
    if (ADMIN_EMAIL && (process.env.SENDGRID_API_KEY || process.env.RESEND_API_KEY || process.env.SMTP_HOST)) {
        try {
            await sendEmail('adminNotification', { subject, message, data });
        } catch (err) {
            console.error('Admin notification error:', err);
        }
    }
};

const formatUserResponse = (user) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  plan: user.pro_tier ? 'pro' : 'free',
  avatar: user.avatar_url,
  pro_tier: user.pro_tier,
  notification_settings: user.notification_settings
});

const generateTokens = (user) => {
    const accessToken = jwt.sign(
        { id: user.id, email: user.email, name: user.name },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );
    
    const refreshToken = jwt.sign(
        { id: user.id, type: 'refresh' },
        JWT_REFRESH_SECRET,
        { expiresIn: JWT_REFRESH_EXPIRES_IN }
    );
    
    return { accessToken, refreshToken };
};

const storeRefreshToken = async (userId, refreshToken) => {
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    await pool.query(
        'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
        [userId, refreshToken, expiresAt]
    );
};

const revokeRefreshToken = async (token) => {
    await pool.query(
        'UPDATE refresh_tokens SET revoked = true WHERE token = $1',
        [token]
    );
};

router.post('/register', validateRegistration, async (req, res) => {
    const { email, password, name } = req.body;

    try {
        const existingUser = await pool.query(
            'SELECT id FROM users WHERE email = $1',
            [email.toLowerCase()]
        );

        if (existingUser.rows.length > 0) {
            return res.status(409).json({
                error: 'Registration failed',
                message: 'Email already registered'
            });
        }

        const saltRounds = 12;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        const result = await pool.query(
            `INSERT INTO users (email, password_hash, name)
             VALUES ($1, $2, $3)
             RETURNING id, email, name, pro_tier, created_at`,
            [email.toLowerCase(), passwordHash, name]
        );

        const user = result.rows[0];
        const { accessToken, refreshToken } = generateTokens(user);
        await storeRefreshToken(user.id, refreshToken);

        // Email notification via queue
        if (process.env.SENDGRID_API_KEY || process.env.RESEND_API_KEY || process.env.SMTP_HOST) {
            await EmailQueue.addToQueue(user.email, 'Welcome to TrelloClone!', 'welcome', { name: user.name, email: user.email });
        }

        await Notification.create(user.id, 'welcome', 'Welcome!', 'Welcome to TrelloClone. Your account is ready to use.');
        
        await AuditLog.log(user.id, 'user_registered', 'user', user.id, { email: user.email }, req.ip, req.headers['user-agent']);

        if (ADMIN_EMAIL) {
            await sendAdminNotification(
                'New User Registration',
                `A new user has registered: ${name} (${email})`,
                { userId: user.id, email: user.email, name: user.name, timestamp: new Date().toISOString() }
            );
        }

        res.status(201).json({
            message: 'Registration successful!',
            token: accessToken,
            refreshToken,
            user: formatUserResponse(user)
        });
    } catch (error) {
        console.error('Registration error:', error);
        
        await AuditLog.log(null, 'registration_error', 'user', null, { email, error: error.message }, req.ip, req.headers['user-agent'], 'error');
        
        if (ADMIN_EMAIL) {
            await sendAdminNotification('Registration Error', `Registration failed for ${email}: ${error.message}`);
        }
        
        res.status(500).json({
            error: 'Registration failed',
            message: 'Something went wrong. Please try again.'
        });
    }
});

router.post('/login', validateLogin, async (req, res) => {
    const { email, password, deviceInfo } = req.body;

    try {
        const result = await pool.query(
            'SELECT id, email, password_hash, name, pro_tier FROM users WHERE email = $1',
            [email.toLowerCase()]
        );

        if (result.rows.length === 0) {
            await AuditLog.log(null, 'login_failed', 'user', null, { email, reason: 'user_not_found' }, req.ip, req.headers['user-agent'], 'failure');
            return res.status(401).json({
                error: 'Login failed',
                message: 'Invalid email or password'
            });
        }

        const user = result.rows[0];
        const isValid = await bcrypt.compare(password, user.password_hash);

        if (!isValid) {
            await AuditLog.log(user.id, 'login_failed', 'user', user.id, { email, reason: 'invalid_password' }, req.ip, req.headers['user-agent'], 'failure');
            
            // Check for suspicious activity (multiple failed attempts)
            const recentFailures = await AuditLog.findByUser(user.id, 10, 0);
            const recentFailedLogins = recentFailures.filter(a => a.action === 'login_failed' && new Date(a.created_at) > new Date(Date.now() - 15 * 60 * 1000));
            if (recentFailedLogins.length >= 5) {
                await sendAdminNotification('Suspicious Login Activity', `Multiple failed login attempts for ${email}`, { userId: user.id, email, ip: req.ip });
                await AuditLog.log(user.id, 'suspicious_login', 'user', user.id, { email, ip: req.ip }, req.ip, req.headers['user-agent'], 'warning');
            }
            
            return res.status(401).json({
                error: 'Login failed',
                message: 'Invalid email or password'
            });
        }

        await pool.query(
            'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1',
            [user.id]
        );

        const { accessToken, refreshToken } = generateTokens(user);
        await storeRefreshToken(user.id, refreshToken);

        // Send login alert via email queue
        if (process.env.SENDGRID_API_KEY || process.env.RESEND_API_KEY || process.env.SMTP_HOST) {
            await EmailQueue.addToQueue(user.email, 'Login Alert', 'loginAlert', {
                name: user.name,
                email: user.email,
                ip: req.ip,
                location: deviceInfo?.location || 'Unknown'
            });
        }

        await Notification.create(user.id, 'login', 'New Login', `You logged in from ${deviceInfo?.location || 'a new location'}`);
        
        await AuditLog.log(user.id, 'user_login', 'user', user.id, { email, ip: req.ip, location: deviceInfo?.location }, req.ip, req.headers['user-agent']);

        if (ADMIN_EMAIL) {
            await sendAdminNotification(
                'User Login',
                `${user.name} logged in from ${deviceInfo?.location || 'unknown location'}`,
                { userId: user.id, email: user.email, location: deviceInfo?.location, ip: req.ip, timestamp: new Date().toISOString() }
            );
        }

        res.json({
            message: 'Login successful!',
            token: accessToken,
            refreshToken,
            user: formatUserResponse(user)
        });
    } catch (error) {
        console.error('Login error:', error);
        
        await AuditLog.log(null, 'login_error', 'user', null, { email, error: error.message }, req.ip, req.headers['user-agent'], 'error');
        
        if (ADMIN_EMAIL) {
            await sendAdminNotification('Login Error', `Login failed for ${email}: ${error.message}`);
        }
        
        res.status(500).json({
            error: 'Login failed',
            message: 'Something went wrong. Please try again.'
        });
    }
});

router.post('/refresh', async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(400).json({ error: 'Refresh token required' });
    }

    try {
        // Verify the refresh token
        const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
        
        // Check if token exists in database and is not revoked
        const tokenResult = await pool.query(
            'SELECT * FROM refresh_tokens WHERE token = $1 AND revoked = false AND expires_at > NOW()',
            [refreshToken]
        );

        if (tokenResult.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid or expired refresh token' });
        }

        // Revoke old refresh token
        await revokeRefreshToken(refreshToken);

        // Get user
        const userResult = await pool.query(
            'SELECT id, email, name, pro_tier, avatar_url FROM users WHERE id = $1',
            [decoded.id]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = userResult.rows[0];
        const tokens = generateTokens(user);
        await storeRefreshToken(user.id, tokens.refreshToken);

        await AuditLog.log(user.id, 'token_refreshed', 'user', user.id, {}, req.ip, req.headers['user-agent']);

        res.json({
            token: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            user: formatUserResponse(user)
        });
    } catch (error) {
        console.error('Token refresh error:', error);
        res.status(401).json({ error: 'Invalid refresh token' });
    }
});

router.post('/logout', async (req, res) => {
    const { refreshToken } = req.body;
    
    try {
        if (refreshToken) {
            await revokeRefreshToken(refreshToken);
        }
        
        const authHeader = req.headers.authorization;
        const token = authHeader?.split(' ')[1];
        if (token) {
            try {
                const decoded = jwt.verify(token, JWT_SECRET);
                await AuditLog.log(decoded.id, 'user_logout', 'user', decoded.id, {}, req.ip, req.headers['user-agent']);
                if (ADMIN_EMAIL) {
                    await sendAdminNotification('User Logout', `${decoded.name || 'A user'} logged out`);
                }
            } catch (e) {
                // Token might be expired, that's fine
            }
        }
        
        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        console.error('Logout error:', error);
        res.json({ message: 'Logged out successfully' });
    }
});

router.get('/me', async (req, res) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const result = await pool.query(
            'SELECT id, email, name, pro_tier, created_at, avatar_url, notification_settings FROM users WHERE id = $1',
            [decoded.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(formatUserResponse(result.rows[0]));
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
        }
        res.status(401).json({ error: 'Invalid token' });
    }
});

module.exports = router;