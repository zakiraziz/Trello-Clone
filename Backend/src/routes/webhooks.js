const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { v4: uuidv4 } = require('uuid');

router.post('/subscribe', async (req, res) => {
    const { boardId, url, events } = req.body;
    const userId = req.user.id;

    if (!boardId || !url || !events || !Array.isArray(events)) {
        return res.status(400).json({ error: 'boardId, url, and events are required' });
    }

    try {
        const boardCheck = await pool.query(
            'SELECT id FROM board_members WHERE board_id = $1 AND user_id = $2',
            [boardId, userId]
        );

        if (boardCheck.rows.length === 0) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const id = uuidv4();
        const result = await pool.query(
            `INSERT INTO webhook_subscriptions (id, board_id, url, events)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [id, boardId, url, events]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Webhook subscription error:', error);
        res.status(500).json({ error: 'Failed to create webhook' });
    }
});

const triggerWebhook = async (boardId, event, data) => {
    try {
        const subscriptions = await pool.query(
            'SELECT url FROM webhook_subscriptions WHERE board_id = $1 AND $2 = ANY(events) AND is_active = true',
            [boardId, event]
        );

        const axios = require('axios');
        const payload = {
            event,
            boardId,
            data,
            timestamp: new Date().toISOString()
        };

        for (const sub of subscriptions.rows) {
            try {
                await axios.post(sub.url, payload, {
                    timeout: 5000,
                    headers: { 'Content-Type': 'application/json' }
                });
            } catch (error) {
                console.error(`Webhook failed for ${sub.url}:`, error.message);
            }
        }
    } catch (error) {
        console.error('Webhook trigger error:', error);
    }
};

module.exports = router;
module.exports.triggerWebhook = triggerWebhook;