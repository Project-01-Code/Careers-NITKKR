import './config/env.config.js';
import http from 'http';
import mongoose from 'mongoose';
import app from './app.js';
import { connectDB } from './db/connectDB.js';

// Environment variables are loaded first via env.config.js (before any other module reads process.env)

let server;

/* ------------------- GRACEFUL SHUTDOWN ------------------- */

const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);

  // Force close after 10 seconds (in case of hang)
  const forceExit = setTimeout(() => {
    console.error('❌ Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
  forceExit.unref();

  try {
    // 1. Close HTTP Server
    if (server) {
      console.log('⏳ Closing HTTP server...');

      // Close all existing connections to avoid hanging
      if (server.closeAllConnections) server.closeAllConnections();

      await new Promise((resolve, reject) => {
        server.close((err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      console.log('✅ HTTP server closed');
    }

    // 2. Close Database Connection
    console.log('⏳ Closing database connection...');
    // mongoose.connection.close() handles the active connection
    await mongoose.connection.close(false);
    console.log('✅ Database connection closed');
    console.log('👋 Graceful shutdown completed');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error during shutdown:', err);
    process.exit(1);
  }
};

/* ------------------- GLOBAL ERROR SAFETY ------------------- */

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ UNCAUGHT EXCEPTION! Shutting down...');
  console.error('Error:', err.name, err.message);
  console.error('Stack:', err.stack);
  // For uncaught exceptions, we should exit immediately or restart
  // But attempting a graceful shutdown is often safer for data
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ UNHANDLED REJECTION! Shutting down...');
  console.error('Error:', err);
  gracefulShutdown('UNHANDLED_REJECTION');
});

// Listen for termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

/* ------------------- SERVER BOOTSTRAP ------------------- */

const PORT = process.env.PORT || 8000;
const NODE_ENV = process.env.NODE_ENV || 'development';

const startServer = async () => {
  try {
    console.log('🚀 Starting server...');
    console.log(`🌱 Environment: ${NODE_ENV}`);

    // Validate required environment variables
    const requiredEnvVars = [
      'MONGODB_URI',
      'ACCESS_TOKEN_SECRET',
      'REFRESH_TOKEN_SECRET',
      'ACCESS_TOKEN_EXPIRY',
      'REFRESH_TOKEN_EXPIRY',
      'CLOUDINARY_CLOUD_NAME',
      'CLOUDINARY_API_KEY',
      'CLOUDINARY_API_SECRET',
    ];

    const missingVars = requiredEnvVars.filter(
      (varName) => !process.env[varName]
    );

    if (missingVars.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missingVars.join(', ')}`
      );
    }

    console.log('✅ Environment variables validated');

    // Initialize database connection
    await connectDB();

    // Create HTTP server
    server = http.createServer(app);

    // Start listening
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
