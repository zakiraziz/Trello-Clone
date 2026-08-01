const express = require('express');
const router = express.Router();
const EmailQueue = require('../services/emailQueue');

// Get email queue status
router.get('/status', async (req, res) => {
    try {
        const status = await EmailQueue.getQueueStatus();
        res.json({ status });
    } catch (error) {
        console.error('Get email status error:', error);
        res.status(500).json({ error: 'Failed to fetch email status' });
    }
});

// Process queue manually
router.post('/process', async (req, res) => {
    try {
        const result = await EmailQueue.processQueue();
        res.json({ message: 'Queue processed', ...result });
    } catch (error) {
        console.error('Process email queue error:', error);
        res.status(500).json({ error: 'Failed to process email queue' });
    }
});

// Retry failed emails
router.post('/retry', async (req, res) => {
    try {
        const result = await EmailQueue.retryFailedEmails();
        res.json({ message: 'Failed emails queued for retry', ...result });
    } catch (error) {
        console.error('Retry emails error:', error);
        res.status(500).json({ error: 'Failed to retry emails' });
    }
});

// Cleanup old emails
router.delete('/cleanup', async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 30;
        const result = await EmailQueue.cleanupOldEmails(days);
        res.json({ message: 'Old emails cleaned up', ...result });
    } catch (error) {
        console.error('Cleanup emails error:', error);
        res.status(500).json({ error: 'Failed to cleanup emails' });
    }
});

module.exports = router;