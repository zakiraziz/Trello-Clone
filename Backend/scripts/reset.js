const pool = require('../src/db/pool');

async function reset() {
    try {
        console.log('🔄 Resetting database...');
        
        const tables = [
            'webhook_subscriptions',
            'payment_history',
            'activity_logs',
            'card_comments',
            'card_labels',
            'cards',
            'lists',
            'board_members',
            'boards',
            'users'
        ];

        for (const table of tables) {
            await pool.query(`DROP TABLE IF EXISTS ${table} CASCADE`);
        }

        console.log('✅ Database reset completed!');
        console.log('📝 Run npm run db:migrate to recreate tables');
    } catch (error) {
        console.error('❌ Reset failed:', error);
    } finally {
        await pool.end();
    }
}

reset();