const pool = require('../db/pool');
const { v4: uuidv4 } = require('uuid');

class Board {
    static async findAll(userId) {
        const result = await pool.query(
            `SELECT DISTINCT b.*,
                (SELECT COUNT(*) FROM board_members WHERE board_id = b.id) as member_count,
                (SELECT COUNT(*) FROM lists WHERE board_id = b.id AND is_archived = false) as list_count
             FROM boards b
             LEFT JOIN board_members bm ON b.id = bm.board_id
             WHERE b.owner_id = $1 OR bm.user_id = $1
             AND b.is_archived = false
             ORDER BY b.created_at DESC`,
            [userId]
        );
        return result.rows;
    }

    static async findById(id) {
        const result = await pool.query(
            `SELECT b.*, u.name as owner_name
             FROM boards b
             JOIN users u ON b.owner_id = u.id
             WHERE b.id = $1`,
            [id]
        );
        return result.rows[0];
    }

    static async create(name, ownerId, description = '', backgroundColor = '#f4f5f7') {
        const id = uuidv4();
        const result = await pool.query(
            `INSERT INTO boards (id, name, description, owner_id, background_color)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [id, name, description, ownerId, backgroundColor]
        );
        return result.rows[0];
    }

    static async update(id, updates) {
        const { name, description, background_color, is_archived } = updates;
        const result = await pool.query(
            `UPDATE boards 
             SET name = COALESCE($1, name),
                 description = COALESCE($2, description),
                 background_color = COALESCE($3, background_color),
                 is_archived = COALESCE($4, is_archived),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $5
             RETURNING *`,
            [name, description, background_color, is_archived, id]
        );
        return result.rows[0];
    }

    static async delete(id) {
        await pool.query('DELETE FROM boards WHERE id = $1', [id]);
        return true;
    }

    static async addMember(boardId, userId, role = 'editor') {
        const result = await pool.query(
            'INSERT INTO board_members (board_id, user_id, role) VALUES ($1, $2, $3) RETURNING *',
            [boardId, userId, role]
        );
        return result.rows[0];
    }

    static async getMembers(boardId) {
        const result = await pool.query(
            `SELECT u.id, u.name, u.email, u.avatar_url, bm.role, bm.joined_at
             FROM board_members bm
             JOIN users u ON bm.user_id = u.id
             WHERE bm.board_id = $1
             ORDER BY bm.joined_at ASC`,
            [boardId]
        );
        return result.rows;
    }
}

module.exports = Board;