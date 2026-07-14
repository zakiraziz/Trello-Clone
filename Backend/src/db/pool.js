const { Pool } = require('pg');
const config = require('../config/database');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ...config
});

pool.connect((err) => {
    if (err) {
        console.error('❌ Database connection error:', err.stack);
    } else {
        console.log('✅ Connected to PostgreSQL successfully!');
    }
});

pool.on('error', (err) => {
    console.error('❌ Unexpected database error:', err);
});

module.exports = pool;