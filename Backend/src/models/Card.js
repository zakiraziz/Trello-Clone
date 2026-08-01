const pool = require('../db/pool');

class Card {
    static async findByList(listId) {
        const result = await pool.query(
            'SELECT * FROM cards WHERE list_id = $1 AND is_archived = false ORDER BY position',
            [listId]
        );
        return result.rows;
    }

    static async create(listId, title, description = '', position = 0, dueDate = null, assignedTo = null, createdBy) {
        const result = await pool.query(
            `INSERT INTO cards (list_id, title, description, position, due_date, created_by, assigned_to)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            [listId, title, description, position, dueDate, createdBy, assignedTo]
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
        const result = await pool.query(
            `INSERT INTO card_comments (card_id, user_id, content)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [cardId, userId, content]
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

    static async addLabel(cardId, name, color) {
        const result = await pool.query(
            `INSERT INTO card_labels (card_id, name, color)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [cardId, name, color]
        );
        return result.rows[0];
    }

    static async getLabels(cardId) {
        const result = await pool.query(
            'SELECT * FROM card_labels WHERE card_id = $1',
            [cardId]
        );
        return result.rows;
    }

    static async removeLabel(cardId, labelId) {
        await pool.query(
            'DELETE FROM card_labels WHERE card_id = $1 AND id = $2',
            [cardId, labelId]
        );
        return true;
    }

    static async createChecklist(cardId, title) {
        const result = await pool.query(
            `INSERT INTO card_checklists (card_id, title)
             VALUES ($1, $2)
             RETURNING *`,
            [cardId, title]
        );
        return result.rows[0];
    }

    static async getChecklists(cardId) {
        const result = await pool.query(
            `SELECT c.*,
                COALESCE(
                    (SELECT json_agg(json_build_object(
                        'id', i.id,
                        'checklist_id', i.checklist_id,
                        'text', i.text,
                        'completed', i.is_completed,
                        'position', i.position
                    ) ORDER BY i.position)
                    FROM card_checklist_items i
                    WHERE i.checklist_id = c.id
                ), '[]'::json) as items
            FROM card_checklists c
            WHERE c.card_id = $1
            ORDER BY c.position`,
            [cardId]
        );
        return result.rows;
    }

    static async updateChecklist(checklistId, updates) {
        const { title } = updates;
        const result = await pool.query(
            `UPDATE card_checklists 
             SET title = COALESCE($1, title)
             WHERE id = $2
             RETURNING *`,
            [title, checklistId]
        );
        return result.rows[0];
    }

    static async deleteChecklist(checklistId) {
        await pool.query('DELETE FROM card_checklists WHERE id = $1', [checklistId]);
        return true;
    }

    static async addChecklistItem(checklistId, text, position = 0) {
        const result = await pool.query(
            `INSERT INTO card_checklist_items (checklist_id, text, position)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [checklistId, text, position]
        );
        return result.rows[0];
    }

    static async updateChecklistItem(itemId, updates) {
        const { text, completed, position } = updates;
        const result = await pool.query(
            `UPDATE card_checklist_items 
             SET text = COALESCE($1, text),
                 is_completed = COALESCE($2, is_completed),
                 position = COALESCE($3, position)
             WHERE id = $4
             RETURNING *`,
            [text, completed, position, itemId]
        );
        return result.rows[0];
    }

    static async deleteChecklistItem(itemId) {
        await pool.query('DELETE FROM card_checklist_items WHERE id = $1', [itemId]);
        return true;
    }
}

module.exports = Card;