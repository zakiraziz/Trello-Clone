const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, async (req, res) => {
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
        return res.json({ boards: [], cards: [] });
    }

    const searchTerm = `%${q.trim()}%`;

    try {
        // Search boards
        const boardsResult = await pool.query(
            `SELECT DISTINCT b.id, b.name as title, b.description,
                (SELECT COUNT(*) FROM cards c 
                 JOIN lists l ON c.list_id = l.id 
                 WHERE l.board_id = b.id AND c.is_archived = false) as "cardCount"
             FROM boards b
             LEFT JOIN board_members bm ON b.id = bm.board_id
             WHERE (b.owner_id = $1 OR bm.user_id = $1)
             AND b.is_archived = false
             AND (b.name ILIKE $2 OR b.description ILIKE $2)
             ORDER BY b.name
             LIMIT 20`,
            [req.user.id, searchTerm]
        );

        // Search cards
        const cardsResult = await pool.query(
            `SELECT c.id, c.title, c.list_id, l.board_id, l.title as "listName"
             FROM cards c
             JOIN lists l ON c.list_id = l.id
             JOIN boards b ON l.board_id = b.id
             LEFT JOIN board_members bm ON b.id = bm.board_id
             WHERE (b.owner_id = $1 OR bm.user_id = $1)
             AND b.is_archived = false
             AND c.is_archived = false
             AND c.title ILIKE $2
             ORDER BY c.title
             LIMIT 20`,
            [req.user.id, searchTerm]
        );

        res.json({
            boards: boardsResult.rows,
            cards: cardsResult.rows
        });
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: 'Search failed' });
    }
});

module.exports = router;