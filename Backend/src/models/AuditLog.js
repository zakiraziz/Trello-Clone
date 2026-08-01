const pool = require('../db/pool');

class AuditLog {
    static async log(userId, action, entityType, entityId, details = {}, ipAddress = null, userAgent = null, status = 'success') {
        try {
            const result = await pool.query(
                `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address, user_agent, status)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                 RETURNING *`,
                [userId, action, entityType, entityId, JSON.stringify(details), ipAddress, userAgent, status]
            );
            return result.rows[0];
        } catch (error) {
            console.error('Audit log error:', error);
            return null;
        }
    }

    static async findByUser(userId, limit = 50, offset = 0) {
        const result = await pool.query(
            `SELECT * FROM audit_logs WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
            [userId, limit, offset]
        );
        return result.rows;
    }

    static async findAll(limit = 50, offset = 0) {
        const result = await pool.query(
            `SELECT a.*, u.name as user_name, u.email as user_email
             FROM audit_logs a
             LEFT JOIN users u ON a.user_id = u.id
             ORDER BY a.created_at DESC
             LIMIT $1 OFFSET $2`,
            [limit, offset]
        );
        return result.rows;
    }

    static async findByAction(action, limit = 50) {
        const result = await pool.query(
            `SELECT a.*, u.name as user_name, u.email as user_email
             FROM audit_logs a
             LEFT JOIN users u ON a.user_id = u.id
             WHERE a.action = $1
             ORDER BY a.created_at DESC
             LIMIT $2`,
            [action, limit]
        );
        return result.rows;
    }

    static async getStats(days = 30) {
        const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        const result = await pool.query(
            `SELECT action, COUNT(*) as count
             FROM audit_logs
             WHERE created_at > $1
             GROUP BY action
             ORDER BY count DESC`,
            [since]
        );
        return result.rows;
    }

    static async getRecentSecurityAlerts(limit = 20) {
        const result = await pool.query(
            `SELECT a.*, u.name as user_name, u.email as user_email
             FROM audit_logs a
             LEFT JOIN users u ON a.user_id = u.id
             WHERE a.action IN ('login_failed', 'password_changed', 'password_reset', 'suspicious_login', 'profile_updated')
             ORDER BY a.created_at DESC
             LIMIT $1`,
            [limit]
        );
        return result.rows;
    }
}

module.exports = AuditLog;