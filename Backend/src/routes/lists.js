const express = require('express');
const router = express.Router();
const { checkBoardAccess } = require('../middleware/auth');
const List = require('../models/List');
const Activity = require('../models/Activity');
const AuditLog = require('../models/AuditLog');
const pool = require('../db/pool');

router.post('/', checkBoardAccess, async (req, res) => {
    const { board_id, title, position } = req.body;

    if (!title) {
        return res.status(400).json({
            error: 'List title required',
            message: 'Please provide a title for the list'
        });
    }

    try {
        const list = await List.create(board_id, title, position);
        await Activity.log(board_id, req.user.id, 'created_list', 'list', list.id, { title });
        await AuditLog.log(req.user.id, 'list_created', 'list', list.id, { boardId: board_id, title }, req.ip, req.headers['user-agent']);

        const io = req.app.get('io');
        if (io) {
            io.broadcastToBoard(board_id, 'listCreated', { list, boardId: board_id, userId: req.user.id });
        }

        res.status(201).json({
            message: 'List created successfully!',
            list
        });
    } catch (error) {
        console.error('Create list error:', error);
        res.status(500).json({ error: 'Failed to create list' });
    }
});

router.put('/:id', checkBoardAccess, async (req, res) => {
    const { title, position } = req.body;

    try {
        const list = await List.update(req.params.id, { title, position });
        const boardResult = await pool.query('SELECT board_id FROM lists WHERE id = $1', [req.params.id]);
        const boardId = boardResult.rows[0]?.board_id;

        if (boardId) {
            await Activity.log(boardId, req.user.id, 'updated_list', 'list', req.params.id, { title });
            await AuditLog.log(req.user.id, 'list_updated', 'list', req.params.id, { boardId, title }, req.ip, req.headers['user-agent']);

            const io = req.app.get('io');
            if (io) {
                io.broadcastToBoard(boardId, 'listUpdated', { list, boardId, userId: req.user.id });
            }
        }

        res.json({
            message: 'List updated successfully!',
            list
        });
    } catch (error) {
        console.error('Update list error:', error);
        res.status(500).json({ error: 'Failed to update list' });
    }
});

router.delete('/:id', checkBoardAccess, async (req, res) => {
    try {
        const boardResult = await pool.query('SELECT board_id FROM lists WHERE id = $1', [req.params.id]);
        const boardId = boardResult.rows[0]?.board_id;

        await List.delete(req.params.id);

        if (boardId) {
            await Activity.log(boardId, req.user.id, 'deleted_list', 'list', req.params.id);
            await AuditLog.log(req.user.id, 'list_deleted', 'list', req.params.id, { boardId }, req.ip, req.headers['user-agent']);

            const io = req.app.get('io');
            if (io) {
                io.broadcastToBoard(boardId, 'listDeleted', { listId: req.params.id, boardId, userId: req.user.id });
            }
        }

        res.json({ message: 'List deleted successfully!' });
    } catch (error) {
        console.error('Delete list error:', error);
        res.status(500).json({ error: 'Failed to delete list' });
    }
});

router.put('/reorder/:boardId', checkBoardAccess, async (req, res) => {
    const { listOrder } = req.body;

    if (!listOrder || !Array.isArray(listOrder)) {
        return res.status(400).json({
            error: 'Invalid order',
            message: 'Please provide an array of list IDs'
        });
    }

    try {
        await List.reorder(req.params.boardId, listOrder);
        await Activity.log(req.params.boardId, req.user.id, 'reordered_lists', 'board', req.params.boardId, { listOrder });

        const io = req.app.get('io');
        if (io) {
            io.broadcastToBoard(req.params.boardId, 'listsReordered', { boardId: req.params.boardId, listOrder, userId: req.user.id });
        }

        res.json({ message: 'Lists reordered successfully!' });
    } catch (error) {
        console.error('Reorder lists error:', error);
        res.status(500).json({ error: 'Failed to reorder lists' });
    }
});

module.exports = router;