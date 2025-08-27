import mongoose from "mongoose";

// Global variable to store the mongoose instance in development
// This prevents hot reloading from creating new connections
declare global {
  var mongoose:
    | {
        conn: typeof mongoose | null;
        promise: Promise<typeof mongoose> | null;
      }
    | undefined;
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

/**
 * Connect to MongoDB using Mongoose
 * Implements connection caching for development hot reloading
 *
 * @returns Promise<typeof mongoose> - The mongoose instance
 */
async function connectMongoDB(): Promise<typeof mongoose> {
  // Return existing connection if available
  if (cached!.conn) {
    return cached!.conn;
  }

  // Return existing promise if connection is in progress
  if (!cached!.promise) {
    const opts = {
      bufferCommands: false, // Disable mongoose buffering
      maxPoolSize: 10, // Maximum number of connections in the pool
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      family: 4, // Use IPv4, skip trying IPv6
    };

    // Get MongoDB URI from environment
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error("MONGODB_URI environment variable is not set");
    }

    // Create connection promise
    cached!.promise = mongoose.connect(mongoUri, opts);
  }

  try {
    cached!.conn = await cached!.promise;
    console.log("✅ Connected to MongoDB successfully");
    return cached!.conn;
  } catch (error) {
    cached!.promise = null;
    console.error("❌ MongoDB connection error:", error);
    throw error;
  }
}

/**
 * Disconnect from MongoDB
 * Used for graceful shutdown
 */
async function disconnectMongoDB(): Promise<void> {
  if (cached!.conn) {
    await cached!.conn.disconnect();
    cached!.conn = null;
    cached!.promise = null;
    console.log("🔌 Disconnected from MongoDB");
  }
}

/**
 * Get the current connection status
 *
 * @returns string - Connection status
 */
function getConnectionStatus(): string {
  if (!cached!.conn) {
    return "disconnected";
  }

  const states = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };

  return (
    states[cached!.conn.connection.readyState as keyof typeof states] ||
    "unknown"
  );
}

export { connectMongoDB, disconnectMongoDB, getConnectionStatus };
export default connectMongoDB;
