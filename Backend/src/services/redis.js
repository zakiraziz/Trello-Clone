/**
 * Redis service module.
 * Gracefully handles missing 'redis' package (development/testing without Redis).
 */
let redis = null;
try {
  redis = require('redis');
} catch (e) {
  console.warn('Redis package not installed - caching disabled (development mode)');
}

let redisClient = null;

// Initialize Redis connection
async function connectRedis() {
  if (!redis) {
    console.log('Redis package not available - skipping connection');
    return null;
  }

  try {
    redisClient = redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    });

    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
      console.log('Redis client connected');
    });

    redisClient.on('ready', () => {
      console.log('Redis client ready');
    });

    redisClient.on('end', () => {
      console.log('Redis client disconnected');
    });

    await redisClient.connect();

    return redisClient;
  } catch (error) {
    console.error('Failed to connect to Redis:', error.message);
    // Application can still function without Redis
    redisClient = null;
    return null;
  }
}

// Get Redis client
function getClient() {
  return redisClient;
}

// Cache helper functions
const cache = {
  // Get cached value
  async get(key) {
    if (!redisClient) return null;

    try {
      const value = await redisClient.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  },

  // Set cached value with TTL (seconds)
  async set(key, value, ttl = 3600) {
    if (!redisClient) return false;

    try {
      await redisClient.setEx(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Redis set error:', error);
      return false;
    }
  },

  // Delete cached value
  async del(key) {
    if (!redisClient) return false;

    try {
      await redisClient.del(key);
      return true;
    } catch (error) {
      console.error('Redis del error:', error);
      return false;
    }
  },

  // Delete multiple keys by pattern
  async delPattern(pattern) {
    if (!redisClient) return false;

    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
      return true;
    } catch (error) {
      console.error('Redis delPattern error:', error);
      return false;
    }
  },

  // Check if key exists
  async exists(key) {
    if (!redisClient) return false;

    try {
      const result = await redisClient.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Redis exists error:', error);
      return false;
    }
  },

  // Set expiration on key
  async expire(key, ttl) {
    if (!redisClient) return false;

    try {
      await redisClient.expire(key, ttl);
      return true;
    } catch (error) {
      console.error('Redis expire error:', error);
      return false;
    }
  },

  // Get TTL of key
  async ttl(key) {
    if (!redisClient) return -1;

    try {
      return await redisClient.ttl(key);
    } catch (error) {
      console.error('Redis ttl error:', error);
      return -1;
    }
  },

  // Increment counter
  async incr(key) {
    if (!redisClient) return null;

    try {
      return await redisClient.incr(key);
    } catch (error) {
      console.error('Redis incr error:', error);
      return null;
    }
  },

  // Set counter with TTL
  async incrWithTTL(key, ttl) {
    if (!redisClient) return null;

    try {
      const pipeline = redisClient.multi();
      pipeline.incr(key);
      pipeline.expire(key, ttl);
      const results = await pipeline.exec();
      return results[0][1];
    } catch (error) {
      console.error('Redis incrWithTTL error:', error);
      return null;
    }
  },
};

// Session store for express-session
const sessionStore = {
  async get(sessionId) {
    const session = await cache.get(`session:${sessionId}`);
    return session;
  },

  async set(sessionId, session, ttl = 86400) {
    await cache.set(`session:${sessionId}`, session, ttl);
  },

  async destroy(sessionId) {
    await cache.del(`session:${sessionId}`);
  },
};

// Rate limiting store
const rateLimitStore = {
  async get(key) {
    const count = await cache.get(`ratelimit:${key}`);
    return count || 0;
  },

  async increment(key, window) {
    const count = await cache.incrWithTTL(`ratelimit:${key}`, window);
    return count || 1;
  },
};

// Disconnect Redis
async function disconnect() {
  if (redisClient) {
    try {
      await redisClient.quit();
    } catch (e) {
      // Ignore disconnect errors
    }
    redisClient = null;
  }
}

module.exports = {
  connectRedis,
  getClient,
  cache,
  sessionStore,
  rateLimitStore,
  disconnect,
};