const Redis = require('ioredis');

let redis;
if (process.env.REDIS_URL) {
  redis = new Redis(process.env.REDIS_URL);
  redis.on('error', (err) => {
    console.error('[Redis] Connection error:', err);
  });
} else {
  console.warn('[Redis] REDIS_URL not set. Redis caching disabled.');
}

module.exports = redis;