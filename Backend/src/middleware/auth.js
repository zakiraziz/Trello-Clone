const jwt = require('jsonwebtoken');
const pool = require('../db/pool');

const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            error: 'Authentication required',
            message: 'Please login to access this resource'
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userResult = await pool.query(
            'SELECT id, email, name, pro_tier FROM users WHERE id = $1',
            [decoded.id]
        );

        if (userResult.rows.length === 0) {
            return res.status(401).json({
                error: 'Authentication failed',
                message: 'User no longer exists'
            });
        }

        req.user = userResult.rows[0];
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: 'Authentication failed',
                message: 'Your session has expired. Please login again.'
            });
        }
        return res.status(403).json({
            error: 'Authentication failed',
            message: 'Invalid token'
        });
    }
};

const checkBoardAccess = async (req, res, next) => {
    const boardId = req.params.boardId || req.params.id || req.body.board_id;
    const userId = req.user.id;

    if (!boardId) {
        return res.status(400).json({ error: 'Board ID required' });
    }

    try {
        const result = await pool.query(
            `SELECT b.id, b.owner_id, bm.role 
             FROM boards b
             LEFT JOIN board_members bm ON b.id = bm.board_id AND bm.user_id = $1
             WHERE b.id = $2 AND (b.owner_id = $1 OR bm.user_id = $1)`,
            [userId, boardId]
        );

        if (result.rows.length === 0) {
            return res.status(403).json({
                error: 'Access denied',
                message: 'You do not have access to this board'
            });
        }

        req.boardAccess = result.rows[0];
        next();
    } catch (error) {
        console.error('Board access check error:', error);
        res.status(500).json({ error: 'Failed to verify board access' });
    }
};

const checkProTier = async (req, res, next) => {
    try {
        const result = await pool.query(
            'SELECT pro_tier, pro_expires_at FROM users WHERE id = $1',
            [req.user.id]
        );
        
        const user = result.rows[0];
        if (!user.pro_tier || (user.pro_expires_at && new Date(user.pro_expires_at) < new Date())) {
            return res.status(403).json({
                error: 'Pro tier required',
                message: 'This feature requires a Pro subscription'
            });
        }
        next();
    } catch (error) {
        res.status(500).json({ error: 'Failed to verify subscription' });
    }
};

module.exports = { authenticateToken, checkBoardAccess, checkProTier };