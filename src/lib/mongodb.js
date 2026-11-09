import mongoose from 'mongoose';

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development and serverless function executions in production (e.g. Vercel).
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  const rawUri = process.env.MONGODB_URI;

  if (!rawUri) {
    console.error('[MongoDB Error] MONGODB_URI environment variable is missing.');
    return null;
  }

  // Check if connection is already established and ready
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  if (!cached.promise) {
    let cleanUri = rawUri.trim();

    // Auto-fix malformed query string like /?bajiwalaagentcom=Cluster0
    if (cleanUri.includes('/?bajiwalaagentcom=')) {
      cleanUri = cleanUri.replace('/?bajiwalaagentcom=', '/bajiwalaagentcom?appName=');
    }

    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 10000,
      dbName: process.env.MONGODB_DB_NAME || 'bajiwalaagentcom'
    };

    console.log(`[MongoDB] Connecting to database: ${opts.dbName}...`);

    cached.promise = mongoose.connect(cleanUri, opts).then((mongooseInstance) => {
      console.log(`[MongoDB] Successfully connected to database: ${opts.dbName}`);
      return mongooseInstance;
    }).catch(err => {
      console.error('[MongoDB Connection Error]:', err.message);
      cached.promise = null;
      return null;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    console.error('[MongoDB Exception]:', e.message);
    return null;
  }

  return cached.conn;
}

export default dbConnect;
