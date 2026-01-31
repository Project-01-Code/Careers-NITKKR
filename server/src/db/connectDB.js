import mongoose from "mongoose";
import { DB_NAME, DB_CONFIG } from "../constants.js";

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      dbName: DB_NAME,
      maxPoolSize: DB_CONFIG.MAX_POOL_SIZE,
      minPoolSize: DB_CONFIG.MIN_POOL_SIZE,
      serverSelectionTimeoutMS: DB_CONFIG.SERVER_SELECTION_TIMEOUT,
      socketTimeoutMS: DB_CONFIG.SOCKET_TIMEOUT,
      autoIndex: DB_CONFIG.AUTO_INDEX,
      maxIdleTimeMS: DB_CONFIG.MAX_IDLE_TIME
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📁 Database: ${conn.connection.name}`);
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    throw error;
  }
};
