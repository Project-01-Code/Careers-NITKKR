import dotenv from "dotenv";
import http from "http";
import app from "./app.js";
import { initDB } from "./db/index.js";

// Load environment variables
dotenv.config();

/* ------------------- GLOBAL ERROR SAFETY ------------------- */

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error("❌ UNCAUGHT EXCEPTION! Shutting down...");
  console.error("Error:", err.name, err.message);
  console.error("Stack:", err.stack);
  process.exit(1);
});

let server;

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error("❌ UNHANDLED REJECTION! Shutting down...");
  console.error("Error:", err);

  if (server) {
    server.close(() => {
      console.log("Server closed");
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

/* ------------------- GRACEFUL SHUTDOWN ------------------- */

const gracefulShutdown = (signal) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);

  if (server) {
    server.close(async () => {
      console.log("✅ HTTP server closed");

      try {
        // Close database connection
        const mongoose = await import("mongoose");
        await mongoose.default.connection.close();
        console.log("✅ Database connection closed");

        console.log("👋 Graceful shutdown completed");
        process.exit(0);
      } catch (err) {
        console.error("❌ Error during shutdown:", err);
        process.exit(1);
      }
    });

    // Force close after 10 seconds
    setTimeout(() => {
      console.error("❌ Forced shutdown after timeout");
      process.exit(1);
    }, 10000);
  } else {
    process.exit(0);
  }
};

// Listen for termination signals
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

/* ------------------- SERVER BOOTSTRAP ------------------- */

const PORT = process.env.PORT || 8000;
const NODE_ENV = process.env.NODE_ENV || "development";

const startServer = async () => {
  try {
    console.log("🚀 Starting server...");
    console.log(`🌱 Environment: ${NODE_ENV}`);

    // Initialize database connection
    await initDB();

    // Create HTTP server
    server = http.createServer(app);

    // Start listening
    server.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
      console.log(`🔒 API endpoint: http://localhost:${PORT}/api`);
      console.log("━".repeat(50));
    });
  } catch (err) {
    console.error("❌ Server startup failed:", err);
    process.exit(1);
  }
};

// Start the server
startServer();
