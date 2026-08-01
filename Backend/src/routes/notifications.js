const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const Notification = require('../models/Notification');

router.get('/', authenticateToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    
    const notifications = await Notification.getUserNotifications(req.user.id, limit, offset);
    const unreadCount = await Notification.getUnreadCount(req.user.id);
    
    res.json({
      notifications,
      unreadCount
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

router.get('/unread-count', authenticateToken, async (req, res) => {
  try {
    const count = await Notification.getUnreadCount(req.user.id);
    res.json({ unreadCount: count });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
});

router.put('/:id/read', authenticateToken, async (req, res) => {
  try {
    const notification = await Notification.markAsRead(req.params.id, req.user.id);
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    res.json({ success: true, notification });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

router.put('/read-all', authenticateToken, async (req, res) => {
  try {
    const count = await Notification.markAllAsRead(req.user.id);
    res.json({ success: true, count });
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await Notification.delete(req.params.id, req.user.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

router.delete('/', authenticateToken, async (req, res) => {
  try {
    await Notification.deleteAll(req.user.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete all notifications error:', error);
    res.status(500).json({ error: 'Failed to delete notifications' });
  }
});

module.exports = router;