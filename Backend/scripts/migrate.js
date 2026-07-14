const pool = require('../src/db/pool');
const fs = require('fs');
const path = require('path');

async function migrate() {
    try {
        const schema = fs.readFileSync(path.join(__dirname, '../schema.sql'), 'utf8');
        await pool.query(schema);
        console.log('✅ Database migration completed successfully!');
    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        await pool.end();
    }
}

migrate();