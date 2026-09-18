/**
 * Database schema bootstrap.
 *
 * Managed platforms (Render, Railway, ...) do not always grant shell access on
 * their free tiers, so `npm run migrate` cannot be executed by hand. This
 * module applies the SQL schema automatically on boot instead.
 *
 * Every statement in the SQL files is idempotent (CREATE ... IF NOT EXISTS /
 * DROP TRIGGER IF EXISTS), which makes re-running them on each boot safe.
 */
const fs = require('fs');
const path = require('path');
const pool = require('./pool');

// Applied in order — schema.sql creates the core tables, 002 adds the tables
// that back audit logging, the email queue and JWT refresh tokens.
const SQL_FILES = [
    path.join('Database', 'schema.sql'),
    path.join('Database', 'migrations', '002_create_tables.sql'),
];

/**
 * Locates a SQL file regardless of whether the process runs from the repo root
 * or from the Backend/ directory (Render `rootDir`).
 */
function resolveSqlFile(relativePath) {
    const candidates = [
        // <repo>/Backend/src/db -> <repo>
        path.join(__dirname, '..', '..', '..', relativePath),
        // cwd is the repo root
        path.join(process.cwd(), relativePath),
        // cwd is <repo>/Backend
        path.join(process.cwd(), '..', relativePath),
    ];

    return candidates.find((candidate) => fs.existsSync(candidate)) || null;
}

async function ensureSchema() {
    // Nothing to do against the in-memory fallback database.
    if (!process.env.DATABASE_URL || process.env.NODE_ENV === 'test') {
        return { skipped: true, applied: [] };
    }

    const applied = [];

    for (const relativePath of SQL_FILES) {
        const filePath = resolveSqlFile(relativePath);

        if (!filePath) {
            console.warn(`⚠️  Schema file not found, skipping: ${relativePath}`);
            continue;
        }

        const sql = fs.readFileSync(filePath, 'utf8');
        await pool.query(sql);
        applied.push(relativePath);
        console.log(`✅ Applied schema: ${relativePath}`);
    }

    return { skipped: false, applied };
}

module.exports = ensureSchema;
