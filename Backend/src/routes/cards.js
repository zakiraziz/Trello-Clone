const express = require('express');
const router = express.Router();
const Card = require('../models/Card');
const Activity = require('../models/Activity');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');
const EmailQueue = require('../services/emailQueue');
const pool = require('../db/pool');
const { checkBoardAccess } = require('../middleware/auth');

// Create card
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
        
        const boardResult = await pool.query('SELECT board_id FROM lists WHERE id = $1', [list_id]);
        const boardId = boardResult.rows[0]?.board_id;

        if (boardId) {
            await Activity.log(boardId, req.user.id, 'created_card', 'card', card.id, { title });
            await AuditLog.log(req.user.id, 'card_created', 'card', card.id, { boardId, listId: list_id, title }, req.ip, req.headers['user-agent']);

            const io = req.app.get('io');
            if (io) {
                io.broadcastToBoard(boardId, 'cardCreated', { card, boardId, userId: req.user.id });
            }
        }

        if (assigned_to) {
            const assigneeResult = await pool.query('SELECT name, email FROM users WHERE id = $1', [assigned_to]);
            const assignee = assigneeResult.rows[0];
            if (assignee) {
                await Notification.create(assigned_to, 'assignment', 'Task Assigned', `You were assigned to "${title}"`);
                if (process.env.SENDGRID_API_KEY || process.env.RESEND_API_KEY || process.env.SMTP_HOST) {
                    await EmailQueue.addToQueue(assignee.email, `Task Assigned: ${title}`, 'taskAssigned', {
                        assignee: { name: assignee.name, email: assignee.email },
                        taskName: title,
                        boardName: boardResult.rows[0]?.name || 'a board'
                    });
                }
            }
        }

        res.status(201).json({ message: 'Card created successfully!', card });
    } catch (error) {
        console.error('Create card error:', error);
        res.status(500).json({ error: 'Failed to create card' });
    }
});

// Update card
router.put('/:id', checkBoardAccess, async (req, res) => {
    const { title, description, position, due_date, assigned_to, is_completed } = req.body;

    try {
        const card = await Card.update(req.params.id, { title, description, position, due_date, assigned_to, is_completed });

        const boardResult = await pool.query(
            `SELECT l.board_id, b.name as board_name FROM cards c
             JOIN lists l ON c.list_id = l.id
             JOIN boards b ON l.board_id = b.id
             WHERE c.id = $1`,
            [req.params.id]
        );
        const boardId = boardResult.rows[0]?.board_id;

        if (boardId) {
            await Activity.log(boardId, req.user.id, 'updated_card', 'card', req.params.id, { title });
            await AuditLog.log(req.user.id, 'card_updated', 'card', req.params.id, { boardId, title }, req.ip, req.headers['user-agent']);

            const io = req.app.get('io');
            if (io) {
                io.broadcastToBoard(boardId, 'cardUpdated', { card, boardId, userId: req.user.id });
            }
        }

        res.json({ message: 'Card updated successfully!', card });
    } catch (error) {
        console.error('Update card error:', error);
        res.status(500).json({ error: 'Failed to update card' });
    }
});

// PATCH route for card updates
router.patch('/:id', checkBoardAccess, async (req, res) => {
    const { title, description, position, due_date, assigned_to, is_completed } = req.body;

    try {
        const card = await Card.update(req.params.id, { title, description, position, due_date, assigned_to, is_completed });

        const boardResult = await pool.query(
            `SELECT l.board_id FROM cards c
             JOIN lists l ON c.list_id = l.id
             WHERE c.id = $1`,
            [req.params.id]
        );
        const boardId = boardResult.rows[0]?.board_id;

        if (boardId) {
            await Activity.log(boardId, req.user.id, 'updated_card', 'card', req.params.id, { title });
            const io = req.app.get('io');
            if (io) {
                io.broadcastToBoard(boardId, 'cardUpdated', { card, boardId, userId: req.user.id });
            }
        }

        res.json({ message: 'Card updated successfully!', card });
    } catch (error) {
        console.error('Update card error:', error);
        res.status(500).json({ error: 'Failed to update card' });
    }
});

// Move card
router.put('/:id/move', checkBoardAccess, async (req, res) => {
    const { list_id, position } = req.body;

    if (!list_id) {
        return res.status(400).json({ error: 'List ID required', message: 'Please specify the target list' });
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
            await Activity.log(boardId, req.user.id, 'moved_card', 'card', req.params.id, { from_list: card.list_id, to_list: list_id });
            await AuditLog.log(req.user.id, 'card_moved', 'card', req.params.id, { boardId, toList: list_id }, req.ip, req.headers['user-agent']);

            const io = req.app.get('io');
            if (io) {
                io.broadcastToBoard(boardId, 'cardMoved', { cardId: req.params.id, fromList: card.list_id, toList: list_id, position, boardId, userId: req.user.id });
            }
        }

        res.json({ message: 'Card moved successfully!', card });
    } catch (error) {
        console.error('Move card error:', error);
        res.status(500).json({ error: 'Failed to move card' });
    }
});

// Delete card
router.delete('/:id', checkBoardAccess, async (req, res) => {
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
            await AuditLog.log(req.user.id, 'card_deleted', 'card', req.params.id, { boardId }, req.ip, req.headers['user-agent']);

            const io = req.app.get('io');
            if (io) {
                io.broadcastToBoard(boardId, 'cardDeleted', { cardId: req.params.id, boardId, userId: req.user.id });
            }
        }

        res.json({ message: 'Card deleted successfully!' });
    } catch (error) {
        console.error('Delete card error:', error);
        res.status(500).json({ error: 'Failed to delete card' });
    }
});

// Add comment
router.post('/:id/comments', checkBoardAccess, async (req, res) => {
    const content = req.body.text || req.body.content;

    if (!content) {
        return res.status(400).json({ error: 'Content required', message: 'Please provide comment content' });
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
            await AuditLog.log(req.user.id, 'comment_added', 'card', req.params.id, { boardId, content: content.substring(0, 100) }, req.ip, req.headers['user-agent']);

            const io = req.app.get('io');
            if (io) {
                io.broadcastToBoard(boardId, 'commentAdded', { comment: { ...comment, author: { id: req.user.id, name: req.user.name } }, cardId: req.params.id, boardId, userId: req.user.id });
            }
        }

        // Handle @mentions
        const mentionRegex = /@(\w+)/g;
        const mentions = content.match(mentionRegex) || [];
        for (const mention of mentions) {
            const userName = mention.substring(1);
            const mentionedUserResult = await pool.query('SELECT id, name, email FROM users WHERE name ILIKE $1 OR email ILIKE $1', [`%${userName}%`]);
            if (mentionedUserResult.rows.length > 0) {
                const mentionedUser = mentionedUserResult.rows[0];
                const cardResult = await pool.query('SELECT c.title, l.board_id FROM cards c JOIN lists l ON c.list_id = l.id WHERE c.id = $1', [req.params.id]);
                const cardTitle = cardResult.rows[0]?.title || 'a card';
                await Notification.create(mentionedUser.id, 'mention', 'You were mentioned', `${req.user.name} mentioned you in "${cardTitle}"`);
                if (process.env.SENDGRID_API_KEY || process.env.RESEND_API_KEY || process.env.SMTP_HOST) {
                    await EmailQueue.addToQueue(mentionedUser.email, `${req.user.name} mentioned you`, 'commentMention', { user: mentionedUser, commenter: { name: req.user.name, email: req.user.email }, taskName: cardTitle });
                }
            }
        }

        const commentWithAuthor = { ...comment, author: { id: req.user.id, name: req.user.name, avatar: req.user.avatar_url } };
        res.status(201).json(commentWithAuthor);
    } catch (error) {
        console.error('Add comment error:', error);
        res.status(500).json({ error: 'Failed to add comment' });
    }
});

// Get comments
router.get('/:id/comments', async (req, res) => {
    try {
        const comments = await Card.getComments(req.params.id);
        res.json(comments);
    } catch (error) {
        console.error('Get comments error:', error);
        res.status(500).json({ error: 'Failed to fetch comments' });
    }
});

// Update labels
router.patch('/:id/labels', checkBoardAccess, async (req, res) => {
    const { labels } = req.body;
    if (!labels || !Array.isArray(labels)) {
        return res.status(400).json({ error: 'Labels required', message: 'Please provide an array of labels' });
    }

    try {
        const existingLabels = await Card.getLabels(req.params.id);
        for (const label of existingLabels) await Card.removeLabel(req.params.id, label.id);
        for (const label of labels) await Card.addLabel(req.params.id, label.name, label.color);

        const boardResult = await pool.query('SELECT l.board_id FROM cards c JOIN lists l ON c.list_id = l.id WHERE c.id = $1', [req.params.id]);
        const boardId = boardResult.rows[0]?.board_id;
        if (boardId) {
            await Activity.log(boardId, req.user.id, 'updated_labels', 'card', req.params.id, { labels });
            const io = req.app.get('io');
            if (io) io.broadcastToBoard(boardId, 'labelsUpdated', { cardId: req.params.id, labels, boardId, userId: req.user.id });
        }

        res.json({ message: 'Labels updated!', labels });
    } catch (error) {
        console.error('Update labels error:', error);
        res.status(500).json({ error: 'Failed to update labels' });
    }
});

// Get labels
router.get('/:id/labels', async (req, res) => {
    try {
        const labels = await Card.getLabels(req.params.id);
        res.json(labels);
    } catch (error) {
        console.error('Get labels error:', error);
        res.status(500).json({ error: 'Failed to fetch labels' });
    }
});

// Checklist toggle item
router.patch('/:cardId/checklists/:checklistId/items/:itemId/toggle', async (req, res) => {
    const { cardId, checklistId, itemId } = req.params;
    try {
        const item = await Card.updateChecklistItem(itemId, { completed: true });
        const boardResult = await pool.query('SELECT l.board_id FROM cards c JOIN lists l ON c.list_id = l.id WHERE c.id = $1', [cardId]);
        const boardId = boardResult.rows[0]?.board_id;
        if (boardId) {
            await Activity.log(boardId, req.user.id, 'toggled_checklist_item', 'card', cardId, { itemId });
            const io = req.app.get('io');
            if (io) io.broadcastToBoard(boardId, 'checklistItemToggled', { cardId, checklistId, itemId, item, boardId, userId: req.user.id });
        }
        res.json({ message: 'Item toggled!', item });
    } catch (error) {
        console.error('Toggle checklist item error:', error);
        res.status(500).json({ error: 'Failed to toggle item' });
    }
});

// Create checklist
router.post('/:id/checklists', async (req, res) => {
    const { title } = req.body;
    if (!title) return res.status(400).json({ error: 'Checklist title required', message: 'Please provide a checklist title' });

    try {
        const checklist = await Card.createChecklist(req.params.id, title);
        const boardResult = await pool.query('SELECT l.board_id FROM cards c JOIN lists l ON c.list_id = l.id WHERE c.id = $1', [req.params.id]);
        const boardId = boardResult.rows[0]?.board_id;
        if (boardId) {
            await Activity.log(boardId, req.user.id, 'created_checklist', 'card', req.params.id, { title });
            const io = req.app.get('io');
            if (io) io.broadcastToBoard(boardId, 'checklistCreated', { cardId: req.params.id, checklist, boardId, userId: req.user.id });
        }
        res.status(201).json({ message: 'Checklist created!', checklist });
    } catch (error) {
        console.error('Create checklist error:', error);
        res.status(500).json({ error: 'Failed to create checklist' });
    }
});

// Get checklists
router.get('/:id/checklists', async (req, res) => {
    try {
        const checklists = await Card.getChecklists(req.params.id);
        res.json(checklists);
    } catch (error) {
        console.error('Get checklists error:', error);
        res.status(500).json({ error: 'Failed to fetch checklists' });
    }
});

// Update checklist
router.put('/checklists/:checklistId', async (req, res) => {
    const { title } = req.body;
    try {
        const checklist = await Card.updateChecklist(req.params.checklistId, { title });
        res.json({ message: 'Checklist updated!', checklist });
    } catch (error) {
        console.error('Update checklist error:', error);
        res.status(500).json({ error: 'Failed to update checklist' });
    }
});

// Delete checklist
router.delete('/checklists/:checklistId', async (req, res) => {
    try {
        await Card.deleteChecklist(req.params.checklistId);
        res.json({ message: 'Checklist deleted' });
    } catch (error) {
        console.error('Delete checklist error:', error);
        res.status(500).json({ error: 'Failed to delete checklist' });
    }
});

// Add checklist item
router.post('/checklists/:checklistId/items', async (req, res) => {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Item text required', message: 'Please provide item text' });
    try {
        const item = await Card.addChecklistItem(req.params.checklistId, text);
        res.status(201).json({ message: 'Item added!', item });
    } catch (error) {
        console.error('Add checklist item error:', error);
        res.status(500).json({ error: 'Failed to add item' });
    }
});

// Update checklist item
router.patch('/checklists/items/:itemId', async (req, res) => {
    const { text, completed, position } = req.body;
    try {
        const item = await Card.updateChecklistItem(req.params.itemId, { text, completed, position });
        res.json({ message: 'Item updated!', item });
    } catch (error) {
        console.error('Update checklist item error:', error);
        res.status(500).json({ error: 'Failed to update item' });
    }
});

// Delete checklist item
router.delete('/checklists/items/:itemId', async (req, res) => {
    try {
        await Card.deleteChecklistItem(req.params.itemId);
        res.json({ message: 'Item deleted' });
    } catch (error) {
        console.error('Delete checklist item error:', error);
        res.status(500).json({ error: 'Failed to delete item' });
    }
});

module.exports = router;