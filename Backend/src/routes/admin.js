const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { sendEmail } = require('../services/emailService');
const Notification = require('../models/Notification');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_NAME = process.env.ADMIN_NAME || 'Admin';

async function sendAdminNotification(subject, message, data = {}) {
    if (ADMIN_EMAIL && (process.env.SENDGRID_API_KEY || process.env.RESEND_API_KEY || process.env.SMTP_HOST)) {
        try {
            await sendEmail('adminNotification', { subject, message, data });
        } catch (err) {
            console.error('Admin notification error:', err);
        }
    }
}

router.get('/stats', async (req, res) => {
    try {
        const userCount = await pool.query('SELECT COUNT(*) as count FROM users');
        const boardCount = await pool.query('SELECT COUNT(*) as count FROM boards');
        const cardCount = await pool.query('SELECT COUNT(*) as count FROM cards');
        const notificationCount = await pool.query('SELECT COUNT(*) as count FROM notifications WHERE is_read = false');
        
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const recentUsers = await pool.query(
            "SELECT COUNT(*) as count FROM users WHERE created_at > $1",
            [thirtyDaysAgo]
        );

        res.json({
            totalUsers: parseInt(userCount.rows[0].count, 10),
            totalBoards: parseInt(boardCount.rows[0].count, 10),
            totalCards: parseInt(cardCount.rows[0].count, 10),
            unreadNotifications: parseInt(notificationCount.rows[0].count, 10),
            recentUsers: parseInt(recentUsers.rows[0].count, 10)
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

router.get('/users', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        const result = await pool.query(
            `SELECT id, email, name, pro_tier, created_at, last_login_at
             FROM users
             ORDER BY created_at DESC
             LIMIT $1 OFFSET $2`,
            [limit, offset]
        );

        const countResult = await pool.query('SELECT COUNT(*) as count FROM users');
        const totalUsers = parseInt(countResult.rows[0].count, 10);

        res.json({
            users: result.rows,
            pagination: {
                page,
                limit,
                total: totalUsers,
                pages: Math.ceil(totalUsers / limit)
            }
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

router.get('/users/:id', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, email, name, pro_tier, created_at, last_login_at, 
                    notification_settings, stripe_customer_id, stripe_subscription_id
             FROM users
             WHERE id = $1`,
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ user: result.rows[0] });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

router.get('/activities', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const offset = parseInt(req.query.offset) || 0;
        const activities = await pool.query(
            `SELECT a.*, u.name as user_name, u.email as user_email, b.name as board_name
             FROM activities a
             LEFT JOIN users u ON a.user_id = u.id
             LEFT JOIN boards b ON a.board_id = b.id
             ORDER BY a.created_at DESC
             LIMIT $1 OFFSET $2`,
            [limit, offset]
        );

        res.json({ activities: activities.rows });
    } catch (error) {
        console.error('Get activities error:', error);
        res.status(500).json({ error: 'Failed to fetch activities' });
    }
});

router.delete('/users/:id', async (req, res) => {
    try {
        const userResult = await pool.query(
            'SELECT name, email FROM users WHERE id = $1',
            [req.params.id]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        await pool.query('DELETE FROM board_members WHERE user_id = $1', [req.params.id]);
        await pool.query('DELETE FROM notifications WHERE user_id = $1', [req.params.id]);
        await pool.query('DELETE FROM cards WHERE list_id IN (SELECT id FROM lists WHERE board_id IN (SELECT id FROM boards WHERE owner_id = $1))', [req.params.id]);
        await pool.query('DELETE FROM lists WHERE board_id IN (SELECT id FROM boards WHERE owner_id = $1)', [req.params.id]);
        await pool.query('DELETE FROM boards WHERE owner_id = $1', [req.params.id]);
        await pool.query('DELETE FROM users WHERE id = $1', [req.params.id]);

        sendAdminNotification('User Deleted', `User ${userResult.rows[0].name} has been deleted by an admin`);

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

module.exports = router;