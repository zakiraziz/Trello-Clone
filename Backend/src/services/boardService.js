const pool = require('../db/pool');
const { v4: uuidv4 } = require('uuid');

class BoardService {
    static async getBoardWithDetails(boardId, userId) {
        try {
            const boardResult = await pool.query(
                `SELECT b.*, u.name as owner_name
                 FROM boards b
                 JOIN users u ON b.owner_id = u.id
                 WHERE b.id = $1`,
                [boardId]
            );

            if (boardResult.rows.length === 0) {
                return null;
            }

            const listsResult = await pool.query(
                `SELECT l.*,
                    COALESCE(
                        json_agg(
                            json_build_object(
                                'id', c.id,
                                'title', c.title,
                                'description', c.description,
                                'position', c.position,
                                'due_date', c.due_date,
                                'is_completed', c.is_completed,
                                'assigned_to', c.assigned_to,
                                'created_by', c.created_by,
                                'created_at', c.created_at
                            )
                            ORDER BY c.position
                        ) FILTER (WHERE c.id IS NOT NULL),
                        '[]'
                    ) as cards
                 FROM lists l
                 LEFT JOIN cards c ON c.list_id = l.id AND c.is_archived = false
                 WHERE l.board_id = $1 AND l.is_archived = false
                 GROUP BY l.id
                 ORDER BY l.position`,
                [boardId]
            );

            return {
                ...boardResult.rows[0],
                lists: listsResult.rows
            };
        } catch (error) {
            console.error('Get board with details error:', error);
            throw error;
        }
    }

    static async getBoardMembers(boardId) {
        try {
            const result = await pool.query(
                `SELECT u.id, u.name, u.email, u.avatar_url, bm.role, bm.joined_at
                 FROM board_members bm
                 JOIN users u ON bm.user_id = u.id
                 WHERE bm.board_id = $1
                 ORDER BY bm.joined_at ASC`,
                [boardId]
            );
            return result.rows;
        } catch (error) {
            console.error('Get board members error:', error);
            throw error;
        }
    }
}

module.exports = BoardService;