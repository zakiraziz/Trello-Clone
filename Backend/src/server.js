const { httpServer } = require('./app');
const pool = require('./db/pool');
const ensureSchema = require('./db/ensureSchema');

const PORT = process.env.PORT || 5000;

async function start() {
    // Free managed instances have no shell access, so the schema is applied
    // automatically on boot. Every statement is idempotent.
    try {
        const { skipped, applied } = await ensureSchema();
        console.log(skipped
            ? '🗄️  Using in-memory database (DATABASE_URL not set)'
            : `🗄️  Schema ready (${applied.length} file(s) applied)`);
    } catch (error) {
        console.error('❌ Schema initialization failed:', error.message);
    }

    httpServer.listen(PORT, () => {
        console.log('='.repeat(60));
        console.log('🚀 Trello SaaS Backend');
        console.log('='.repeat(60));
        console.log(`📍 Server: http://localhost:${PORT}`);
        console.log(`📊 Database: ${process.env.DATABASE_URL ? '✅ Connected' : '❌ Missing'}`);
        console.log(`🔐 JWT: ${process.env.JWT_SECRET ? '✅ Configured' : '❌ Missing'}`);
        console.log(`💳 Stripe: ${process.env.STRIPE_SECRET_KEY ? '✅ Configured' : '❌ Missing'}`);
        console.log(`📧 Email: ${process.env.SENDGRID_API_KEY || process.env.RESEND_API_KEY ? '✅ Configured' : '⚠️ Not configured'}`);
        console.log(`🔔 Notifications: ✅ Enabled`);
        console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log('='.repeat(60));
    });
}

start();

process.on('SIGTERM', async () => {
    console.log('\n🛑 Shutting down...');
    await pool.end();
    process.exit(0);
});

process.on('unhandledRejection', (error) => {
    console.error('❌ Unhandled Rejection:', error);
});
