import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import { errorHandler } from './middlewares/error.middleware.js';
import {
  CORS_OPTIONS,
  RATE_LIMIT,
  REQUEST_LIMITS,
  NODE_ENV,
  HTTP_STATUS,
} from './constants.js';
import authRouter from './routes/auth.routes.js';
import noticeRouter from './routes/notice.routes.js';
import adminJobRouter from './routes/admin/job.routes.js';
import publicJobRouter from './routes/public/job.routes.js';
import departmentRouter from './routes/department.routes.js';
import adminUserRouter from './routes/admin/user.routes.js';

const app = express();

/* ------------------- SECURITY MIDDLEWARE ------------------- */

// Helmet - Security headers
app.use(
  helmet({
    contentSecurityPolicy: process.env.NODE_ENV === NODE_ENV.PRODUCTION,
    crossOriginEmbedderPolicy: false,
  })
);

// CORS - Cross-origin resource sharing
app.use(
  cors({
    origin: CORS_OPTIONS.ORIGIN,
    credentials: CORS_OPTIONS.CREDENTIALS,
    methods: CORS_OPTIONS.METHODS,
    allowedHeaders: CORS_OPTIONS.ALLOWED_HEADERS,
  })
);

// Rate limiting - Prevent abuse
const limiter = rateLimit({
  windowMs: RATE_LIMIT.WINDOW_MS,
  max: RATE_LIMIT.MAX_REQUESTS,
  message: RATE_LIMIT.MESSAGE,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

/* ------------------- GENERAL MIDDLEWARE ------------------- */

// Compression - Compress response bodies
app.use(compression());

// Logging - Request logging (only in development)
if (process.env.NODE_ENV !== NODE_ENV.PRODUCTION) {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Body parsing
app.use(express.json({ limit: REQUEST_LIMITS.JSON_LIMIT }));
app.use(
  express.urlencoded({
    extended: true,
    limit: REQUEST_LIMITS.URL_ENCODED_LIMIT,
    parameterLimit: REQUEST_LIMITS.PARAMETER_LIMIT,
  })
);

// Cookie parsing
app.use(cookieParser());

/* ------------------- HEALTH CHECK ------------------- */

app.get('/health', async (req, res) => {
  const dbStatus =
    mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: dbStatus,
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

/* ------------------- API ROUTES ------------------- */

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/notices', noticeRouter);
app.use('/api/v1/admin/jobs', adminJobRouter);
app.use('/api/v1/jobs', publicJobRouter);
app.use('/api/v1/admin/users', adminUserRouter);
app.use('/api/v1/departments', departmentRouter);

/* ------------------- ERROR HANDLING ------------------- */

// 404 handler
app.use((req, res) => {
  res.status(HTTP_STATUS.NOT_FOUND).json({
    success: false,
    message: 'Route not found',
  });
});

// Global error handler
app.use(errorHandler);

export default app;
