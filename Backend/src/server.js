const { httpServer } = require('./app');
const pool = require('./db/pool');

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
    console.log('='.repeat(60));
    console.log('🚀 Trello SaaS Backend');
    console.log('='.repeat(60));
    console.log(`📍 Server: http://localhost:${PORT}`);
    console.log(`📊 Database: ${process.env.DATABASE_URL ? '✅ Connected' : '❌ Missing'}`);
    console.log(`🔐 JWT: ${process.env.JWT_SECRET ? '✅ Configured' : '❌ Missing'}`);
    console.log(`💳 Stripe: ${process.env.STRIPE_SECRET_KEY ? '✅ Configured' : '❌ Missing'}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log('='.repeat(60));
});

process.on('SIGTERM', async () => {
    console.log('\n🛑 Shutting down...');
    await pool.end();
    process.exit(0);
});

process.on('unhandledRejection', (error) => {
    console.error('❌ Unhandled Rejection:', error);
});