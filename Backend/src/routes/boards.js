const express = require('express');
const router = express.Router();
const { checkBoardAccess } = require('../middleware/auth');
const Board = require('../models/Board');
const List = require('../models/List');
const Card = require('../models/Card');
const Activity = require('../models/Activity');
const pool = require('../db/pool');

router.get('/', async (req, res) => {
    try {
        const boards = await Board.findAll(req.user.id);
        res.json(boards);
    } catch (error) {
        console.error('Get boards error:', error);
        res.status(500).json({ error: 'Failed to fetch boards' });
    }
});

router.get('/:id', checkBoardAccess, async (req, res) => {
    try {
        const board = await Board.findById(req.params.id);
        if (!board) {
            return res.status(404).json({ error: 'Board not found' });
        }

        const lists = await List.findByBoard(req.params.id);
        // Fetch cards for each list
        for (const list of lists) {
            const cards = await Card.findByList(list.id);
            list.cards = cards;
        }
        board.lists = lists;

        res.json(board);
    } catch (error) {
        console.error('Get board error:', error);
        res.status(500).json({ error: 'Failed to fetch board' });
    }
});

router.post('/', async (req, res) => {
    const { name, description, background_color } = req.body;

    if (!name) {
        return res.status(400).json({
            error: 'Board name required',
            message: 'Please provide a name for your board'
        });
    }

    try {
        const board = await Board.create(name, req.user.id, description, background_color);
        await Board.addMember(board.id, req.user.id, 'admin');
        await Activity.log(board.id, req.user.id, 'created_board', 'board', board.id, { name });

        res.status(201).json({
            message: 'Board created successfully!',
            board
        });
    } catch (error) {
        console.error('Create board error:', error);
        res.status(500).json({ error: 'Failed to create board' });
    }
});

router.put('/:id', checkBoardAccess, async (req, res) => {
    const { name, description, background_color, is_archived } = req.body;

    try {
        const board = await Board.update(req.params.id, { name, description, background_color, is_archived });
        await Activity.log(req.params.id, req.user.id, 'updated_board', 'board', req.params.id, { name });

        res.json({
            message: 'Board updated successfully!',
            board
        });
    } catch (error) {
        console.error('Update board error:', error);
        res.status(500).json({ error: 'Failed to update board' });
    }
});

router.delete('/:id', checkBoardAccess, async (req, res) => {
    if (req.boardAccess.owner_id !== req.user.id) {
        return res.status(403).json({
            error: 'Permission denied',
            message: 'Only the board owner can delete this board'
        });
    }

    try {
        await Board.delete(req.params.id);
        res.json({ message: 'Board deleted successfully!' });
    } catch (error) {
        console.error('Delete board error:', error);
        res.status(500).json({ error: 'Failed to delete board' });
    }
});

router.post('/:id/share', checkBoardAccess, async (req, res) => {
    const { email, role = 'editor' } = req.body;

    if (!email) {
        return res.status(400).json({
            error: 'Email required',
            message: 'Please provide an email to share with'
        });
    }

    try {
        const userResult = await pool.query(
            'SELECT id, name FROM users WHERE email = $1',
            [email.toLowerCase()]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({
                error: 'User not found',
                message: 'No user found with this email'
            });
        }

        const sharedUser = userResult.rows[0];
        await Board.addMember(req.params.id, sharedUser.id, role);
        await Activity.log(req.params.id, req.user.id, 'shared_board', 'board', req.params.id, { 
            shared_with: sharedUser.id, 
            role 
        });

        res.json({
            message: `Board shared with ${sharedUser.name}!`,
            user: sharedUser
        });
    } catch (error) {
        console.error('Share board error:', error);
        res.status(500).json({ error: 'Failed to share board' });
    }
});

router.get('/:id/members', checkBoardAccess, async (req, res) => {
    try {
        const members = await Board.getMembers(req.params.id);
        res.json(members);
    } catch (error) {
        console.error('Get members error:', error);
        res.status(500).json({ error: 'Failed to fetch members' });
    }
});

module.exports = router;