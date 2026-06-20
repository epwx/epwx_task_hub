import 'dotenv/config';
import express from 'express';
import path from 'path';
import { QueryTypes } from 'sequelize';

// Debug: Print backend working directory on startup
console.log('Backend CWD:', process.cwd());
const app = express();

// Serve uploads directory as static files
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import session from 'express-session';
import passport from './config/passport.js';

// Trust proxy - required when behind nginx/load balancer
app.set('trust proxy', 1);

// Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP to allow cross-origin requests
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000', 'https://tasks.epowex.com'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware for OAuth
app.use(session({
  secret: process.env.SESSION_SECRET || 'epwx-task-hub-secret-key-change-in-production',
  resave: false,
  saveUninitialized: true, // Changed to true to ensure session is created
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // Allow cross-site cookies in production
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Routes (ESM imports only)

import authRouter from './routes/auth.js';
import campaignsRouter from './routes/campaigns.js';
import tasksRouter from './routes/tasks.js';
import usersRouter from './routes/users.js';
import priceRouter from './routes/price.js';
import supplyRouter from './routes/supply.js';
import circulatingRouter from './routes/circulating.js';
import burnedRouter from './routes/burned.js';
import swaggerRouter from './routes/swagger.js';
import epwxRouter from './routes/epwx.js';


import merchantsRouter from './routes/merchants.js';
import claimsRouter from './routes/claims.js';
import twitterCampaignsRouter from './routes/twitterCampaigns.js';
import rewardLedgerRouter from './routes/rewardLedger.js';
import { runDailyDraw } from './routes/epwx.js';
import { DailyDraw } from './models/index.js';

const AUTO_DAILY_DRAW_ENABLED = ['1', 'true', 'yes', 'on'].includes(String(process.env.AUTO_DAILY_DRAW_ENABLED || 'false').toLowerCase());
const AUTO_DAILY_DRAW_TIME_UTC = String(process.env.AUTO_DAILY_DRAW_TIME_UTC || '00:05').trim();
const AUTO_DAILY_DRAW_TARGET = String(process.env.AUTO_DAILY_DRAW_TARGET || 'previous-day').trim().toLowerCase();
const AUTO_DAILY_DRAW_RUN_BY = String(process.env.AUTO_DAILY_DRAW_RUN_BY || 'system:auto-draw').trim();
const AUTO_DAILY_DRAW_LOCK_KEY = Number.parseInt(String(process.env.AUTO_DAILY_DRAW_LOCK_KEY || '90412021'), 10);
const AUTO_DAILY_DRAW_WINNER_COUNT = process.env.AUTO_DAILY_DRAW_WINNER_COUNT
  ? Number.parseInt(String(process.env.AUTO_DAILY_DRAW_WINNER_COUNT), 10)
  : undefined;
const AUTO_DAILY_DRAW_PRIZE_AMOUNT = process.env.AUTO_DAILY_DRAW_PRIZE_AMOUNT
  ? String(process.env.AUTO_DAILY_DRAW_PRIZE_AMOUNT).trim()
  : undefined;

function parseUtcTime(value) {
  const matched = String(value || '').match(/^(\d{2}):(\d{2})$/);
  if (!matched) {
    return null;
  }

  const hour = Number.parseInt(matched[1], 10);
  const minute = Number.parseInt(matched[2], 10);
  if (!Number.isInteger(hour) || !Number.isInteger(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return null;
  }

  return { hour, minute };
}

function getUtcDateString(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function getScheduledDrawDate(now) {
  if (AUTO_DAILY_DRAW_TARGET === 'today') {
    return getUtcDateString(now);
  }

  const previousDay = new Date(now.getTime());
  previousDay.setUTCDate(previousDay.getUTCDate() - 1);
  return getUtcDateString(previousDay);
}

function getNextRunAtUtc(timeConfig, now = new Date()) {
  const next = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    timeConfig.hour,
    timeConfig.minute,
    0,
    0,
  ));

  if (next.getTime() <= now.getTime()) {
    next.setUTCDate(next.getUTCDate() + 1);
  }

  return next;
}

async function acquireAutoDrawLock() {
  const rows = await DailyDraw.sequelize.query(
    'SELECT pg_try_advisory_lock(:lockKey) AS acquired',
    {
      replacements: { lockKey: AUTO_DAILY_DRAW_LOCK_KEY },
      type: QueryTypes.SELECT,
    }
  );

  const acquiredRaw = rows?.[0]?.acquired;
  return acquiredRaw === true || acquiredRaw === 't' || acquiredRaw === 1;
}

async function releaseAutoDrawLock() {
  await DailyDraw.sequelize.query(
    'SELECT pg_advisory_unlock(:lockKey)',
    {
      replacements: { lockKey: AUTO_DAILY_DRAW_LOCK_KEY },
      type: QueryTypes.SELECT,
    }
  );
}

async function executeAutoDailyDraw() {
  const acquired = await acquireAutoDrawLock();
  if (!acquired) {
    console.log('[auto-draw] Skipping run because another backend instance owns the scheduler lock.');
    return;
  }

  try {
    const now = new Date();
    const drawDate = getScheduledDrawDate(now);

    const result = await runDailyDraw({
      drawDate,
      winnerCount: AUTO_DAILY_DRAW_WINNER_COUNT,
      prizeAmount: AUTO_DAILY_DRAW_PRIZE_AMOUNT,
      runBy: AUTO_DAILY_DRAW_RUN_BY,
    });

    console.log(
      `[auto-draw] Daily draw completed for ${drawDate}. drawId=${result.draw.id}, winners=${result.winners.length}, eligible=${result.draw.eligibleCount}`
    );
  } catch (error) {
    if (error?.code === 'DRAW_ALREADY_EXISTS') {
      console.log('[auto-draw] Draw already exists for scheduled date. No action needed.');
      return;
    }

    if (error?.code === 'NO_ELIGIBLE_CLAIMS') {
      console.log('[auto-draw] No eligible claims found for scheduled date. Skipping draw run.');
      return;
    }

    console.error('[auto-draw] Scheduled run failed:', error);
  } finally {
    try {
      await releaseAutoDrawLock();
    } catch (unlockError) {
      console.error('[auto-draw] Failed to release scheduler lock:', unlockError);
    }
  }
}

function startAutoDailyDrawScheduler() {
  if (!AUTO_DAILY_DRAW_ENABLED) {
    console.log('[auto-draw] Scheduler disabled. Set AUTO_DAILY_DRAW_ENABLED=true to enable automatic daily draws.');
    return;
  }

  const timeConfig = parseUtcTime(AUTO_DAILY_DRAW_TIME_UTC);
  if (!timeConfig) {
    console.error(`[auto-draw] Invalid AUTO_DAILY_DRAW_TIME_UTC value: ${AUTO_DAILY_DRAW_TIME_UTC}. Expected HH:MM in UTC.`);
    return;
  }

  const scheduleNextRun = () => {
    const now = new Date();
    const nextRun = getNextRunAtUtc(timeConfig, now);
    const delayMs = Math.max(nextRun.getTime() - now.getTime(), 1000);

    console.log(`[auto-draw] Next scheduled draw check at ${nextRun.toISOString()} (target=${AUTO_DAILY_DRAW_TARGET}).`);

    setTimeout(async () => {
      await executeAutoDailyDraw();
      scheduleNextRun();
    }, delayMs);
  };

  scheduleNextRun();
}

app.use('/api/auth', authRouter);
app.use('/api/campaigns', campaignsRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/users', usersRouter);
app.use('/api/price', priceRouter);
app.use('/api', supplyRouter);
app.use('/api', circulatingRouter);
app.use('/api', burnedRouter);
app.use('/api/docs', swaggerRouter);
app.use('/api/epwx', epwxRouter);

// Merchant onboarding routes (admin only)

// Customer claim routes
app.use('/api/claims', claimsRouter);
app.use('/api/merchants', merchantsRouter);
app.use('/api/twitter-campaigns', twitterCampaignsRouter);
app.use('/api/reward-ledger', rewardLedgerRouter);

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`🚀 EPWX Task Platform API running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  startAutoDailyDrawScheduler();
});

export default app;
