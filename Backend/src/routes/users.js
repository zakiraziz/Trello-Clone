const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db/pool');
const { authenticateToken } = require('../middleware/auth');
const { sendEmail } = require('../services/emailService');
const Notification = require('../models/Notification');

// Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, email, name, pro_tier, avatar_url, created_at, notification_settings FROM users WHERE id = $1',
            [req.user.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        const user = result.rows[0];
        res.json({
            id: user.id,
            email: user.email,
            name: user.name,
            plan: user.pro_tier ? 'pro' : 'free',
            avatar: user.avatar_url,
            created_at: user.created_at,
            notification_settings: user.notification_settings
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

// Get notification preferences
router.get('/notifications', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT notification_settings FROM users WHERE id = $1',
            [req.user.id]
        );
        const settings = result.rows[0]?.notification_settings || { email: {}, in_app: true };
        res.json({ notification_settings: settings });
    } catch (error) {
        console.error('Get notification settings error:', error);
        res.status(500).json({ error: 'Failed to fetch notification settings' });
    }
});

// Update notification preferences
router.put('/notifications', authenticateToken, async (req, res) => {
    const { email, in_app } = req.body;

    try {
        const result = await pool.query(
            'UPDATE users SET notification_settings = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING notification_settings',
            [{ email, in_app }, req.user.id]
        );
        res.json({
            message: 'Notification preferences updated!',
            notification_settings: result.rows[0].notification_settings
        });
    } catch (error) {
        console.error('Update notification settings error:', error);
        res.status(500).json({ error: 'Failed to update notification settings' });
    }
});

// Request password reset
router.post('/password-reset', async (req, res) => {
    const { email } = req.body;

    try {
        const result = await pool.query(
            'SELECT id, name FROM users WHERE email = $1',
            [email.toLowerCase()]
        );

        if (result.rows.length === 0) {
            return res.json({ message: 'If the email exists, a reset link has been sent' });
        }

        const user = result.rows[0];
        const resetToken = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        if (process.env.SENDGRID_API_KEY || process.env.RESEND_API_KEY || process.env.SMTP_HOST) {
            await sendEmail('passwordReset', { name: user.name, email: user.email, token: resetToken });
        }

        await Notification.create(user.id, 'password_reset', 'Password Reset', 'You requested a password reset');

        res.json({ message: 'If the email exists, a reset link has been sent' });
    } catch (error) {
        console.error('Password reset error:', error);
        res.status(500).json({ error: 'Failed to request password reset' });
    }
});

// Confirm password reset
router.post('/password-reset/confirm', async (req, res) => {
    const { token, newPassword } = req.body;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (newPassword.length < 8) {
            return res.status(400).json({
                error: 'Validation error',
                message: 'Password must be at least 8 characters'
            });
        }

        const saltRounds = 12;
        const passwordHash = await bcrypt.hash(newPassword, 12);

        await pool.query(
            'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [passwordHash, decoded.id]
        );

        await Notification.create(decoded.id, 'password_reset', 'Password Changed', 'Your password has been changed successfully');

        res.json({ message: 'Password reset successful' });
    } catch (error) {
        console.error('Password reset confirm error:', error);
        res.status(400).json({ error: 'Invalid or expired token' });
    }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
    const { name, email, bio } = req.body;

    if (!name || !email) {
        return res.status(400).json({
            error: 'Validation error',
            message: 'Name and email are required'
        });
    }

    try {
        const emailCheck = await pool.query(
            'SELECT id, notification_settings FROM users WHERE email = $1 AND id != $2',
            [email.toLowerCase(), req.user.id]
        );
        if (emailCheck.rows.length > 0) {
            return res.status(409).json({
                error: 'Email already in use',
                message: 'This email is already registered to another account'
            });
        }

        const result = await pool.query(
            `UPDATE users 
             SET name = $1, email = $2, bio = COALESCE($3, bio), updated_at = CURRENT_TIMESTAMP
             WHERE id = $4
             RETURNING id, email, name, pro_tier, avatar_url, bio, notification_settings`,
            [name, email.toLowerCase(), bio || null, req.user.id]
        );

        const user = result.rows[0];

        if (process.env.SENDGRID_API_KEY || process.env.RESEND_API_KEY || process.env.SMTP_HOST) {
            await sendEmail('securityAlert', { name: user.name, email: user.email, alertType: 'Profile Updated' });
        }

        await Notification.create(user.id, 'profile_update', 'Profile Updated', 'Your profile has been updated');

        res.json({
            message: 'Profile updated successfully!',
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                plan: user.pro_tier ? 'pro' : 'free',
                avatar: user.avatar_url,
                bio: user.bio
            }
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

// Update password
router.put('/password', authenticateToken, async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({
            error: 'Validation error',
            message: 'Current password and new password are required'
        });
    }

    if (newPassword.length < 8) {
        return res.status(400).json({
            error: 'Validation error',
            message: 'New password must be at least 8 characters'
        });
    }

    try {
        const userResult = await pool.query(
            'SELECT password_hash, name, email FROM users WHERE id = $1',
            [req.user.id]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const isValid = await bcrypt.compare(currentPassword, userResult.rows[0].password_hash);
        if (!isValid) {
            return res.status(401).json({
                error: 'Invalid password',
                message: 'Current password is incorrect'
            });
        }

        const saltRounds = 12;
        const passwordHash = await bcrypt.hash(newPassword, saltRounds);

        await pool.query(
            'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [passwordHash, req.user.id]
        );

        await Notification.create(req.user.id, 'password_change', 'Password Changed', 'Your password was changed');

        res.json({ message: 'Password updated successfully!' });
    } catch (error) {
        console.error('Update password error:', error);
        res.status(500).json({ error: 'Failed to update password' });
    }
});

// Update avatar
router.put('/avatar', authenticateToken, async (req, res) => {
    const { avatar } = req.body;

    if (!avatar) {
        return res.status(400).json({
            error: 'Validation error',
            message: 'Avatar data is required'
        });
    }

    try {
        const result = await pool.query(
            'UPDATE users SET avatar_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING avatar_url',
            [avatar, req.user.id]
        );

        res.json({
            message: 'Avatar updated successfully!',
            avatar: result.rows[0].avatar_url
        });
    } catch (error) {
        console.error('Update avatar error:', error);
        res.status(500).json({ error: 'Failed to update avatar' });
    }
});

// Delete account
router.delete('/account', authenticateToken, async (req, res) => {
    try {
        const user = await pool.query('SELECT name, email FROM users WHERE id = $1', [req.user.id]);
        
        await pool.query('DELETE FROM board_members WHERE user_id = $1', [req.user.id]);
        await pool.query(
            `DELETE FROM cards WHERE list_id IN (SELECT id FROM lists WHERE board_id IN (SELECT id FROM boards WHERE owner_id = $1))`,
            [req.user.id]
        );
        await pool.query(
            'DELETE FROM lists WHERE board_id IN (SELECT id FROM boards WHERE owner_id = $1)',
            [req.user.id]
        );
        await pool.query('DELETE FROM boards WHERE owner_id = $1', [req.user.id]);
        await pool.query('DELETE FROM notifications WHERE user_id = $1', [req.user.id]);
        await pool.query('DELETE FROM users WHERE id = $1', [req.user.id]);

        if (process.env.SENDGRID_API_KEY || process.env.RESEND_API_KEY || process.env.SMTP_HOST) {
            await sendEmail('accountDeleted', { name: user.rows[0]?.name || 'User', email: user.rows[0]?.email });
        }

        res.json({ message: 'Account deleted successfully!' });
    } catch (error) {
        console.error('Delete account error:', error);
        res.status(500).json({ error: 'Failed to delete account' });
    }
});

module.exports = router;