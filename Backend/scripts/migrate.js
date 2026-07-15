const pool = require('../src/db/pool');
const fs = require('fs');
const path = require('path');

async function migrate() {
    try {
        // Schema is located at Database/schema.sql relative to project root
        const schemaPath = path.join(__dirname, '..', '..', 'Database', 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');
        await pool.query(schema);
        console.log('✅ Database migration completed successfully!');
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

migrate();