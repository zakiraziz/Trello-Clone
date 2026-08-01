const pool = require('../db/pool');

class Notification {
  static async create(userId, type, title, message, data = {}) {
    const result = await pool.query(
      `INSERT INTO notifications (user_id, type, title, message, data)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [userId, type, title, message, data]
    );
    return result.rows[0];
  }

  static async getUserNotifications(userId, limit = 50, offset = 0) {
    const result = await pool.query(
      `SELECT * FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    return result.rows;
  }

  static async getUnreadCount(userId) {
    const result = await pool.query(
      `SELECT COUNT(*) as count FROM notifications
       WHERE user_id = $1 AND is_read = false`,
      [userId]
    );
    return parseInt(result.rows[0].count, 10);
  }

  static async markAsRead(notificationId, userId) {
    const result = await pool.query(
      `UPDATE notifications SET is_read = true, read_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [notificationId, userId]
    );
    return result.rows[0];
  }

  static async markAllAsRead(userId) {
    const result = await pool.query(
      `UPDATE notifications SET is_read = true, read_at = CURRENT_TIMESTAMP
       WHERE user_id = $1 AND is_read = false`,
      [userId]
    );
    return result.rowCount;
  }

  static async delete(notificationId, userId) {
    await pool.query(
      `DELETE FROM notifications WHERE id = $1 AND user_id = $2`,
      [notificationId, userId]
    );
    return true;
  }

  static async deleteAll(userId) {
    await pool.query(`DELETE FROM notifications WHERE user_id = $1`, [userId]);
    return true;
  }

  static async createForBoard(userId, action, boardId, boardName) {
    return this.create(userId, 'board', `Board ${action}`, `Your board "${boardName}" was ${action.toLowerCase()}`, {
      boardId,
      action
    });
  }

  static async createForCard(userId, action, cardId, cardTitle, listName) {
    return this.create(userId, 'card', `Card ${action}`, `Card "${cardTitle}" in "${listName}" was ${action.toLowerCase()}`, {
      cardId,
      action
    });
  }

  static async createForUserMention(userId, commenterId, cardId, cardTitle, commenterName) {
    return this.create(userId, 'mention', 'You were mentioned', 
      `${commenterName} mentioned you in "${cardTitle}"`, {
        cardId,
        commenterId
      });
  }

  static async createForUserAssignment(userId, assignerId, cardId, cardTitle, boardName) {
    return this.create(userId, 'assignment', 'Task assigned to you',
      `You were assigned to "${cardTitle}" on board "${boardName}"`, {
        cardId,
        assignerId
      });
  }
}

module.exports = Notification;