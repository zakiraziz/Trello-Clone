const pool = require('../db/pool');
const { v4: uuidv4 } = require('uuid');

class List {
    static async findByBoard(boardId) {
        const result = await pool.query(
            'SELECT * FROM lists WHERE board_id = $1 AND is_archived = false ORDER BY position',
            [boardId]
        );
        return result.rows;
    }

    static async create(boardId, title, position = 0) {
        const id = uuidv4();
        const result = await pool.query(
            `INSERT INTO lists (id, board_id, title, position)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [id, boardId, title, position]
        );
        return result.rows[0];
    }

    static async update(id, updates) {
        const { title, position } = updates;
        const result = await pool.query(
            `UPDATE lists 
             SET title = COALESCE($1, title),
                 position = COALESCE($2, position),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $3
             RETURNING *`,
            [title, position, id]
        );
        return result.rows[0];
    }

    static async delete(id) {
        await pool.query('DELETE FROM lists WHERE id = $1', [id]);
        return true;
    }

    static async reorder(boardId, listOrder) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            for (let i = 0; i < listOrder.length; i++) {
                await client.query(
                    'UPDATE lists SET position = $1 WHERE id = $2 AND board_id = $3',
                    [i, listOrder[i], boardId]
                );
            }
            await client.query('COMMIT');
            return true;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }
}

module.exports = List;