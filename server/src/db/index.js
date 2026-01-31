import mongoose from "mongoose";
import { connectDB } from "./connectDB.js";

export const initDB = async () => {
  // Connection event listeners
  mongoose.connection.on("connected", () => {
    console.log("📦 MongoDB connected");
  });

  mongoose.connection.on("error", (err) => {
    console.error("❌ MongoDB error:", err);
  });

  mongoose.connection.on("disconnected", () => {
    console.warn("⚠️  MongoDB disconnected");
  });

  mongoose.connection.on("reconnected", () => {
    console.log("♻️  MongoDB reconnected");
  });

  // Handle process termination
  process.on("SIGINT", async () => {
    await mongoose.connection.close();
    console.log("MongoDB connection closed through app termination");
    process.exit(0);
  });

  // Initialize connection
  await connectDB();
};
