const express = require('express');
const request = require('supertest');
const rateLimit = require('express-rate-limit');

// Use a lower max for fast testing
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
});

const app = express();
app.use('/test-rate-limit', limiter, (req, res) => res.send('ok'));

describe('Rate limiting middleware', () => {
  it('should block after max requests', async () => {
    let lastResponse;
    for (let i = 0; i < 6; i++) {
      lastResponse = await request(app).get('/test-rate-limit');
    }
    expect(lastResponse.status).toBe(429);
    expect(lastResponse.text).toMatch(/Too many requests/i);
  });
});
