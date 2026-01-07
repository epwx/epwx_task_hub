import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import session from 'express-session';
import passport from './config/passport.js';

const app = express();

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
// ...existing code...
import supplyRouter from './routes/supply.js';
import circulatingRouter from './routes/circulating.js';
import burnedRouter from './routes/burned.js';
import swaggerRouter from './routes/swagger.js';
import epwxRouter from './routes/epwx.js';
app.use('/api/auth', authRouter);
app.use('/api/campaigns', campaignsRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/users', usersRouter);
app.use('/api/price', priceRouter);
// ...existing code...
app.use('/api', supplyRouter);
app.use('/api', circulatingRouter);
app.use('/api', burnedRouter);
app.use('/api/docs', swaggerRouter);
app.use('/api/epwx', epwxRouter);
app.use((err, req, res, next) => {
app.use('/api/auth', authRouter);
app.use('/api/campaigns', campaignsRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/users', usersRouter);
app.use('/api/price', priceRouter);
// ...existing code...
app.use('/api', supplyRouter);
try {
  app.use('/api', circulatingRouter);
  console.log('Registered /api/circulating route');
} catch (err) {
  console.error('Error loading /api/circulating:', err);
}
app.use('/api', burnedRouter);
app.use('/api/docs', swaggerRouter);
app.use('/api/epwx', epwxRouter);
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
});

export default app;
