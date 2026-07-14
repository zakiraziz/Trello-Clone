const pool = require('../db/pool');
const { v4: uuidv4 } = require('uuid');

class Card {
    static async findByList(listId) {
        const result = await pool.query(
            'SELECT * FROM cards WHERE list_id = $1 AND is_archived = false ORDER BY position',
            [listId]
        );
        return result.rows;
    }

    static async create(listId, title, description = '', position = 0, dueDate = null, assignedTo = null, createdBy) {
        const id = uuidv4();
        const result = await pool.query(
            `INSERT INTO cards (id, list_id, title, description, position, due_date, created_by, assigned_to)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING *`,
            [id, listId, title, description, position, dueDate, createdBy, assignedTo]
        );
        return result.rows[0];
    }

    static async update(id, updates) {
        const { title, description, position, due_date, assigned_to, is_completed } = updates;
        const result = await pool.query(
            `UPDATE cards 
             SET title = COALESCE($1, title),
                 description = COALESCE($2, description),
                 position = COALESCE($3, position),
                 due_date = COALESCE($4, due_date),
                 assigned_to = COALESCE($5, assigned_to),
                 is_completed = COALESCE($6, is_completed),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $7
             RETURNING *`,
            [title, description, position, due_date, assigned_to, is_completed, id]
        );
        return result.rows[0];
    }

    static async delete(id) {
        await pool.query('DELETE FROM cards WHERE id = $1', [id]);
        return true;
    }

    static async move(id, listId, position = 0) {
        const result = await pool.query(
            `UPDATE cards 
             SET list_id = $1, position = $2, updated_at = CURRENT_TIMESTAMP
             WHERE id = $3
             RETURNING *`,
            [listId, position, id]
        );
        return result.rows[0];
    }

    static async addComment(cardId, userId, content) {
        const id = uuidv4();
        const result = await pool.query(
            `INSERT INTO card_comments (id, card_id, user_id, content)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [id, cardId, userId, content]
        );
        return result.rows[0];
    }

    static async getComments(cardId) {
        const result = await pool.query(
            `SELECT cc.*, u.name as user_name, u.avatar_url
             FROM card_comments cc
             JOIN users u ON cc.user_id = u.id
             WHERE cc.card_id = $1
             ORDER BY cc.created_at DESC`,
            [cardId]
        );
        return result.rows;
    }
}

module.exports = Card;