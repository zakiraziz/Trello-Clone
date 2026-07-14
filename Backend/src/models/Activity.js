const pool = require('../db/pool');
const { v4: uuidv4 } = require('uuid');

class Activity {
    static async log(boardId, userId, action, entityType, entityId, details = {}) {
        const id = uuidv4();
        await pool.query(
            `INSERT INTO activity_logs (id, board_id, user_id, action, entity_type, entity_id, details)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [id, boardId, userId, action, entityType, entityId, details]
        );
        return id;
    }

    static async findByBoard(boardId, limit = 50, offset = 0) {
        const result = await pool.query(
            `SELECT 
                al.*,
                u.name as user_name,
                u.email as user_email,
                u.avatar_url
             FROM activity_logs al
             LEFT JOIN users u ON al.user_id = u.id
             WHERE al.board_id = $1
             ORDER BY al.created_at DESC
             LIMIT $2 OFFSET $3`,
            [boardId, limit, offset]
        );
        return result.rows;
    }

    static async findRecent(userId, limit = 20) {
        const result = await pool.query(
            `SELECT 
                al.*,
                b.name as board_name,
                u.name as user_name
             FROM activity_logs al
             JOIN boards b ON al.board_id = b.id
             JOIN users u ON al.user_id = u.id
             WHERE al.user_id = $1 OR b.owner_id = $1
             ORDER BY al.created_at DESC
             LIMIT $2`,
            [userId, limit]
        );
        return result.rows;
    }
}

module.exports = Activity;