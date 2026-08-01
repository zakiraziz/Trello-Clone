const pool = require('../db/pool');

class Activity {
  static async log(boardId, userId, action, entityType, entityId, metadata = {}) {
    const result = await pool.query(
      `INSERT INTO activities (board_id, user_id, action, entity_type, entity_id, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [boardId, userId, action, entityType, entityId, metadata]
    );
    return result.rows[0];
  }

  static async getBoardActivities(boardId, limit = 50, offset = 0) {
    const result = await pool.query(
      `SELECT a.*, u.name as user_name, u.email as user_email
       FROM activities a
       LEFT JOIN users u ON a.user_id = u.id
       WHERE a.board_id = $1
       ORDER BY a.created_at DESC
       LIMIT $2 OFFSET $3`,
      [boardId, limit, offset]
    );
    return result.rows;
  }

  static async getAllActivities(limit = 100, offset = 0) {
    const result = await pool.query(
      `SELECT a.*, u.name as user_name, u.email as user_email, b.name as board_name
       FROM activities a
       LEFT JOIN users u ON a.user_id = u.id
       LEFT JOIN boards b ON a.board_id = b.id
       ORDER BY a.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return result.rows;
  }

  static async getUserActivities(userId, limit = 50, offset = 0) {
    const result = await pool.query(
      `SELECT a.*, u.name as user_name, b.name as board_name
       FROM activities a
       LEFT JOIN users u ON a.user_id = u.id
       LEFT JOIN boards b ON a.board_id = b.id
       WHERE a.user_id = $1
       ORDER BY a.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    return result.rows;
  }
}

module.exports = Activity;