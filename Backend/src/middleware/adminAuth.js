/**
 * Admin authentication middleware.
 * Verifies that the authenticated user has admin privileges.
 */
const pool = require('../db/pool');

const requireAdmin = async (req, res, next) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                error: 'Authentication required',
                message: 'Please login to access this resource'
            });
        }

        const result = await pool.query(
            'SELECT role FROM users WHERE id = $1',
            [req.user.id]
        );

        const user = result.rows[0];
        
        if (!user || user.role !== 'admin') {
            return res.status(403).json({
                error: 'Access denied',
                message: 'Admin privileges required'
            });
        }

        next();
    } catch (error) {
        console.error('Admin auth check error:', error);
        res.status(500).json({
            error: 'Authorization check failed',
            message: 'Failed to verify admin privileges'
        });
    }
};

module.exports = { requireAdmin };