const express = require('express')
const router = express.Router()
const db = require('../db/pool')

// Health check endpoint
router.get('/', async (req, res) => {
  try {
    // Check database connection
    const dbResult = await db.query('SELECT 1 as health')
    
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: dbResult.rows[0].health === 1 ? 'connected' : 'error',
      memory: process.memoryUsage(),
      version: process.version
    })
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    })
  }
})

// Readiness check
router.get('/ready', async (req, res) => {
  try {
    // Check all dependencies
    const checks = {
      database: false,
      redis: false
    }

    // Check database
    try {
      await db.query('SELECT 1')
      checks.database = true
    } catch (error) {
      console.error('Database health check failed:', error)
    }

    // Check Redis (if available)
    try {
      const redis = require('../services/redis')
      if (redis) {
        await redis.ping()
        checks.redis = true
      }
    } catch (error) {
      // Redis is optional
      checks.redis = true
    }

    const isReady = Object.values(checks).every(check => check === true)

    res.status(isReady ? 200 : 503).json({
      status: isReady ? 'ready' : 'not ready',
      checks,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      error: error.message,
      timestamp: new Date().toISOString()
    })
  }
})

// Liveness check
router.get('/live', (req, res) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  })
})

module.exports = router