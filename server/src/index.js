import './config/env.config.js';
import http from 'http';
import mongoose from 'mongoose';
import app from './app.js';
import { connectDB } from './db/connectDB.js';
import { startBackgroundWorker } from './services/backgroundWorker.service.js';
import { verifySMTP } from './services/email.service.js';

// Environment variables are loaded first via env.config.js (before any other module reads process.env)

let server;

/* ------------------- GRACEFUL SHUTDOWN ------------------- */

const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);

  const forceExit = setTimeout(() => {
    console.error('❌ Forced shutdown after 10 seconds');
    process.exit(1);
  }, 10000);

  try {
    // Stop accepting new HTTP connections
    if (server) {
      console.log('⏳ Closing HTTP server...');

      await new Promise((resolve, reject) => {
        server.close((err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      console.log('✅ HTTP server closed');
    }

    // Close database connection
    console.log('⏳ Closing database connection...');
    await mongoose.disconnect();
    console.log('✅ Database connection closed');

    clearTimeout(forceExit);
    console.log('👋 Graceful shutdown completed');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error during shutdown:', err);
    process.exit(1);
  }
};

/* ------------------- GLOBAL ERROR SAFETY ------------------- */

process.on('uncaughtException', (err) => {
  console.error('\n❌ UNCAUGHT EXCEPTION');
  console.error(err);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason) => {
  console.error('\n❌ UNHANDLED REJECTION');
  console.error(reason);
  gracefulShutdown('UNHANDLED_REJECTION');
});

// Listen for termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

/* ------------------- SERVER BOOTSTRAP ------------------- */

const startServer = async () => {
  try {
    console.log('━'.repeat(50));
    console.log('🚀 INITIALIZING SERVER...');
    console.log(`🌍 NODE_ENV: ${process.env.NODE_ENV || '⚠ NOT SET (Defaulting to development)'}`);

    // Validate required environment variables
    const requiredEnvVars = [
      // Database
      'MONGODB_URI',
      // Auth
      'ACCESS_TOKEN_SECRET',
      'REFRESH_TOKEN_SECRET',
      'ACCESS_TOKEN_EXPIRY',
      'REFRESH_TOKEN_EXPIRY',
      // Cloudinary
      'CLOUDINARY_CLOUD_NAME',
      'CLOUDINARY_API_KEY',
      'CLOUDINARY_API_SECRET',
      // Email
      'SMTP_HOST',
      'SMTP_PORT',
      'SMTP_USER',
      'SMTP_PASS',
      'EMAIL_FROM',
      // Razorpay
      'RAZORPAY_KEY_ID',
      'RAZORPAY_KEY_SECRET',
      // Frontend
      'CORS_ORIGIN',
    ];

    const missingVars = [];
    const placeholderVars = [];

    requiredEnvVars.forEach(varName => {
      const val = process.env[varName];
      if (!val) {
        missingVars.push(varName);
      } else if (val.startsWith('your-') || val.startsWith('your_') || val.includes('change-this-in-production')) {
        placeholderVars.push(varName);
      }
    });

    if (missingVars.length > 0 || placeholderVars.length > 0) {
      console.error('❌ CRITICAL: Environment Variable Issues Detected!');
      if (missingVars.length > 0) console.error(`   - Missing: ${missingVars.join(', ')}`);
      if (placeholderVars.length > 0) console.error(`   - placeholders: ${placeholderVars.join(', ')}`);
      
      if (process.env.NODE_ENV === 'production') {
        throw new Error('Server startup aborted due to missing/invalid environment variables.');
      }
    }

    console.log('✅ Environment variables validated');

    // Safe debug table (shows keys, but obscures values)
    const envStatus = {};
    requiredEnvVars.forEach(v => {
      envStatus[v] = process.env[v] ? (placeholderVars.includes(v) ? '⚠ PLACEHOLDER' : '✔') : '❌';
    });
    console.table(envStatus);


    // Initialize database connection
    await connectDB();

    // Verify SMTP connection
    await verifySMTP();

    // Start background services
    // NOTE: Background workers are currently running in the main server process.
    // If scaling to multiple server instances horizontally, extract these into a separate
    // worker service (or use Redis/BullMQ) to avoid duplicate execution and database locks.
    startBackgroundWorker();

    // Create HTTP server
    server = http.createServer(app);

    // Start listening
    const PORT = process.env.PORT || 8000;
    server.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
      console.log(`🔒 API endpoint: http://localhost:${PORT}/api`);
      console.log('━'.repeat(50));
    });
  } catch (err) {
    console.error('❌ Server startup failed:', err);
    process.exit(1);
  }
};

// Start the server
startServer();
