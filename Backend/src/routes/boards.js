const express = require('express');
const router = express.Router();
const { checkBoardAccess } = require('../middleware/auth');
const Board = require('../models/Board');
const List = require('../models/List');
const Card = require('../models/Card');
const Activity = require('../models/Activity');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');
const { sendEmail } = require('../services/emailService');
const EmailQueue = require('../services/emailQueue');
const pool = require('../db/pool');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

const sendAdminNotification = async (subject, message, data = {}) => {
    if (ADMIN_EMAIL && (process.env.SENDGRID_API_KEY || process.env.RESEND_API_KEY || process.env.SMTP_HOST)) {
        try {
            await sendEmail('adminNotification', { subject, message, data });
        } catch (err) {
            console.error('Admin notification error:', err);
        }
    }
};

// Get all boards
router.get('/', async (req, res) => {
    try {
        const boards = await Board.findAll(req.user.id);
        res.json(boards);
    } catch (error) {
        console.error('Get boards error:', error);
        res.status(500).json({ error: 'Failed to fetch boards' });
    }
});

// Get board by ID with lists and cards
router.get('/:id', checkBoardAccess, async (req, res) => {
    try {
        const board = await Board.findById(req.params.id);
        if (!board) {
            return res.status(404).json({ error: 'Board not found' });
        }

        const result = await pool.query(`
            SELECT l.*, 
                COALESCE(
                    (SELECT json_agg(json_build_object(
                        'id', c.id,
                        'list_id', c.list_id,
                        'board_id', c.board_id,
                        'title', c.title,
                        'description', c.description,
                        'position', c.position,
                        'due_date', c.due_date,
                        'is_completed', c.is_completed,
                        'assigned_to', c.assigned_to,
                        'created_by', c.created_by,
                        'created_at', c.created_at,
                        'updated_at', c.updated_at
                    ) ORDER BY c.position)
                    FROM cards c
                    WHERE c.list_id = l.id AND c.is_archived = false
                ), '[]'::json) as cards
            FROM lists l
            WHERE l.board_id = $1 AND l.is_archived = false
            ORDER BY l.position
        `, [req.params.id]);

        board.lists = result.rows.map(list => ({
            ...list,
            cards: list.cards || []
        }));

        res.json(board);
    } catch (error) {
        console.error('Get board error:', error);
        res.status(500).json({ error: 'Failed to fetch board' });
    }
});

// Create board
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
        await Notification.create(req.user.id, 'board', 'Board Created', `Your board "${name}" has been created`);
        await AuditLog.log(req.user.id, 'board_created', 'board', board.id, { name }, req.ip, req.headers['user-agent']);

        // Socket.io broadcast
        const io = req.app.get('io');
        if (io) {
            io.emit('boardCreated', { board, userId: req.user.id });
        }

        if (ADMIN_EMAIL) {
            await sendAdminNotification('Board Created', `${req.user.name} created board "${name}"`);
        }

        res.status(201).json({
            message: 'Board created successfully!',
            board
        });
    } catch (error) {
        console.error('Create board error:', error);
        await AuditLog.log(req.user.id, 'board_create_error', 'board', null, { error: error.message }, req.ip, req.headers['user-agent'], 'error');
        res.status(500).json({ error: 'Failed to create board' });
    }
});

// Update board
router.put('/:id', checkBoardAccess, async (req, res) => {
    const { name, description, background_color, is_archived } = req.body;

    try {
        const board = await Board.update(req.params.id, { name, description, background_color, is_archived });
        await Activity.log(req.params.id, req.user.id, 'updated_board', 'board', req.params.id, { name });
        await AuditLog.log(req.user.id, 'board_updated', 'board', req.params.id, { name }, req.ip, req.headers['user-agent']);

        // Socket.io broadcast
        const io = req.app.get('io');
        if (io) {
            io.broadcastToBoard(req.params.id, 'boardUpdated', { board, userId: req.user.id });
        }

        res.json({
            message: 'Board updated successfully!',
            board
        });
    } catch (error) {
        console.error('Update board error:', error);
        res.status(500).json({ error: 'Failed to update board' });
    }
});

// Delete board
router.delete('/:id', checkBoardAccess, async (req, res) => {
    if (req.boardAccess.owner_id !== req.user.id) {
        return res.status(403).json({
            error: 'Permission denied',
            message: 'Only the board owner can delete this board'
        });
    }

    try {
        await Board.delete(req.params.id);
        await AuditLog.log(req.user.id, 'board_deleted', 'board', req.params.id, {}, req.ip, req.headers['user-agent']);

        // Socket.io broadcast
        const io = req.app.get('io');
        if (io) {
            io.broadcastToBoard(req.params.id, 'boardDeleted', { boardId: req.params.id, userId: req.user.id });
        }

        if (ADMIN_EMAIL) {
            await sendAdminNotification('Board Deleted', `${req.user.name} deleted a board`);
        }

        res.json({ message: 'Board deleted successfully!' });
    } catch (error) {
        console.error('Delete board error:', error);
        res.status(500).json({ error: 'Failed to delete board' });
    }
});

// Share board with user
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
        const boardResult = await pool.query('SELECT name FROM boards WHERE id = $1', [req.params.id]);
        const boardName = boardResult.rows[0]?.name || 'a board';
        
        await Board.addMember(req.params.id, sharedUser.id, role);
        await Activity.log(req.params.id, req.user.id, 'shared_board', 'board', req.params.id, { 
            shared_with: sharedUser.id, 
            role 
        });

        await Notification.create(sharedUser.id, 'board_invite', 'Board Invitation', `${req.user.name} invited you to "${boardName}"`);
        await AuditLog.log(req.user.id, 'board_shared', 'board', req.params.id, { sharedWith: sharedUser.id, role }, req.ip, req.headers['user-agent']);
        
        // Send email via queue
        if (process.env.SENDGRID_API_KEY || process.env.RESEND_API_KEY || process.env.SMTP_HOST) {
            await EmailQueue.addToQueue(sharedUser.email, `Board Invitation: ${boardName}`, 'boardInvite', {
                inviter: { name: req.user.name, email: req.user.email },
                invitee: { name: sharedUser.name, email: sharedUser.email },
                boardName
            });
        }

        // Socket.io broadcast
        const io = req.app.get('io');
        if (io) {
            io.broadcastToUser(sharedUser.id, 'boardShared', { 
                boardId: req.params.id, boardName, inviter: req.user.name, role 
            });
        }

        res.json({
            message: `Board shared with ${sharedUser.name}!`,
            user: sharedUser
        });
    } catch (error) {
        console.error('Share board error:', error);
        res.status(500).json({ error: 'Failed to share board' });
    }
});

// Get board members
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