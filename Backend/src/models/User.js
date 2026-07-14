const pool = require('../db/pool');
const bcrypt = require('bcrypt');

class User {
    static async findByEmail(email) {
        const result = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email.toLowerCase()]
        );
        return result.rows[0];
    }

    static async findById(id) {
        const result = await pool.query(
            'SELECT id, email, name, pro_tier, avatar_url, created_at FROM users WHERE id = $1',
            [id]
        );
        return result.rows[0];
    }

    static async create(email, password, name) {
        const saltRounds = 12;
        const passwordHash = await bcrypt.hash(password, saltRounds);
        
        const result = await pool.query(
            `INSERT INTO users (email, password_hash, name)
             VALUES ($1, $2, $3)
             RETURNING id, email, name, pro_tier, created_at`,
            [email.toLowerCase(), passwordHash, name]
        );
        return result.rows[0];
    }

    static async updateProStatus(userId, proTier, expiresAt) {
        const result = await pool.query(
            `UPDATE users 
             SET pro_tier = $1, pro_expires_at = $2, updated_at = CURRENT_TIMESTAMP
             WHERE id = $3
             RETURNING id, email, name, pro_tier, pro_expires_at`,
            [proTier, expiresAt, userId]
        );
        return result.rows[0];
    }
}

module.exports = User;