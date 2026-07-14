const express = require('express');
const router = express.Router();
const Card = require('../models/Card');
const Activity = require('../models/Activity');

router.post('/', async (req, res) => {
    const { list_id, title, description, position, due_date, assigned_to } = req.body;

    if (!list_id || !title) {
        return res.status(400).json({
            error: 'Missing fields',
            message: 'List ID and title are required'
        });
    }

    try {
        const card = await Card.create(list_id, title, description, position, due_date, assigned_to, req.user.id);
        
        const boardResult = await pool.query(
            'SELECT board_id FROM lists WHERE id = $1',
            [list_id]
        );
        const boardId = boardResult.rows[0]?.board_id;

        if (boardId) {
            await Activity.log(boardId, req.user.id, 'created_card', 'card', card.id, { title });
        }

        res.status(201).json({
            message: 'Card created successfully!',
            card
        });
    } catch (error) {
        console.error('Create card error:', error);
        res.status(500).json({ error: 'Failed to create card' });
    }
});

router.put('/:id', async (req, res) => {
    const { title, description, position, due_date, assigned_to, is_completed } = req.body;

    try {
        const card = await Card.update(req.params.id, { 
            title, description, position, due_date, assigned_to, is_completed 
        });

        const boardResult = await pool.query(
            `SELECT l.board_id FROM cards c
             JOIN lists l ON c.list_id = l.id
             WHERE c.id = $1`,
            [req.params.id]
        );
        const boardId = boardResult.rows[0]?.board_id;

        if (boardId) {
            await Activity.log(boardId, req.user.id, 'updated_card', 'card', req.params.id, { title });
        }

        res.json({
            message: 'Card updated successfully!',
            card
        });
    } catch (error) {
        console.error('Update card error:', error);
        res.status(500).json({ error: 'Failed to update card' });
    }
});

router.put('/:id/move', async (req, res) => {
    const { list_id, position } = req.body;

    if (!list_id) {
        return res.status(400).json({
            error: 'List ID required',
            message: 'Please specify the target list'
        });
    }

    try {
        const card = await Card.move(req.params.id, list_id, position);

        const boardResult = await pool.query(
            `SELECT l.board_id FROM cards c
             JOIN lists l ON c.list_id = l.id
             WHERE c.id = $1`,
            [req.params.id]
        );
        const boardId = boardResult.rows[0]?.board_id;

        if (boardId) {
            await Activity.log(boardId, req.user.id, 'moved_card', 'card', req.params.id, { 
                from_list: card.list_id, 
                to_list: list_id 
            });
        }

        res.json({
            message: 'Card moved successfully!',
            card
        });
    } catch (error) {
        console.error('Move card error:', error);
        res.status(500).json({ error: 'Failed to move card' });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const boardResult = await pool.query(
            `SELECT l.board_id FROM cards c
             JOIN lists l ON c.list_id = l.id
             WHERE c.id = $1`,
            [req.params.id]
        );
        const boardId = boardResult.rows[0]?.board_id;

        await Card.delete(req.params.id);

        if (boardId) {
            await Activity.log(boardId, req.user.id, 'deleted_card', 'card', req.params.id);
        }

        res.json({ message: 'Card deleted successfully!' });
    } catch (error) {
        console.error('Delete card error:', error);
        res.status(500).json({ error: 'Failed to delete card' });
    }
});

router.post('/:id/comments', async (req, res) => {
    const { content } = req.body;

    if (!content) {
        return res.status(400).json({
            error: 'Content required',
            message: 'Please provide comment content'
        });
    }

    try {
        const comment = await Card.addComment(req.params.id, req.user.id, content);

        const boardResult = await pool.query(
            `SELECT l.board_id FROM cards c
             JOIN lists l ON c.list_id = l.id
             WHERE c.id = $1`,
            [req.params.id]
        );
        const boardId = boardResult.rows[0]?.board_id;

        if (boardId) {
            await Activity.log(boardId, req.user.id, 'commented_on_card', 'card', req.params.id, { comment: content });
        }

        res.status(201).json({
            message: 'Comment added successfully!',
            comment
        });
    } catch (error) {
        console.error('Add comment error:', error);
        res.status(500).json({ error: 'Failed to add comment' });
    }
});

router.get('/:id/comments', async (req, res) => {
    try {
        const comments = await Card.getComments(req.params.id);
        res.json(comments);
    } catch (error) {
        console.error('Get comments error:', error);
        res.status(500).json({ error: 'Failed to fetch comments' });
    }
});

module.exports = router;