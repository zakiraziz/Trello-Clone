const pool = require('../src/db/pool');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

async function seed() {
    try {
        console.log('🌱 Seeding database...');

        // Create test user
        const userId = uuidv4();
        const passwordHash = await bcrypt.hash('Test@123', 12);
        
        await pool.query(
            `INSERT INTO users (id, email, password_hash, name, pro_tier)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (email) DO NOTHING`,
            [userId, 'demo@trello.com', passwordHash, 'Demo User', true]
        );

        console.log('✅ Seed completed successfully!');
        console.log('📧 Email: demo@trello.com');
        console.log('🔑 Password: Test@123');
    } catch (error) {
        console.error('❌ Seed failed:', error);
    } finally {
        await pool.end();
    }
}

seed();