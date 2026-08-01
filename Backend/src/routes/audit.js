const express = require('express');
const router = express.Router();
const AuditLog = require('../models/AuditLog');

// Get all audit logs
router.get('/logs', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const offset = parseInt(req.query.offset) || 0;
        const logs = await AuditLog.findAll(limit, offset);
        res.json({ logs });
    } catch (error) {
        console.error('Get audit logs error:', error);
        res.status(500).json({ error: 'Failed to fetch audit logs' });
    }
});

// Get audit logs by user
router.get('/logs/user/:userId', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const offset = parseInt(req.query.offset) || 0;
        const logs = await AuditLog.findByUser(req.params.userId, limit, offset);
        res.json({ logs });
    } catch (error) {
        console.error('Get user audit logs error:', error);
        res.status(500).json({ error: 'Failed to fetch user audit logs' });
    }
});

// Get audit logs by action
router.get('/logs/action/:action', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const logs = await AuditLog.findByAction(req.params.action, limit);
        res.json({ logs });
    } catch (error) {
        console.error('Get action audit logs error:', error);
        res.status(500).json({ error: 'Failed to fetch action audit logs' });
    }
});

// Get audit statistics
router.get('/stats', async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 30;
        const stats = await AuditLog.getStats(days);
        res.json({ stats });
    } catch (error) {
        console.error('Get audit stats error:', error);
        res.status(500).json({ error: 'Failed to fetch audit stats' });
    }
});

// Get security alerts
router.get('/security-alerts', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20;
        const alerts = await AuditLog.getRecentSecurityAlerts(limit);
        res.json({ alerts });
    } catch (error) {
        console.error('Get security alerts error:', error);
        res.status(500).json({ error: 'Failed to fetch security alerts' });
    }
});

module.exports = router;