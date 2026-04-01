import mongoose from "mongoose";

/**
 * Mongoose Connection Singleton
 *
 * Caches the connection promise on the Node.js global object to prevent
 * "Too many connections" errors caused by Next.js hot-reloads in dev mode.
 * In production the module-level cache is sufficient since Node doesn't
 * re-evaluate modules on every request.
 */

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    "❌ MONGODB_URI is not defined. Add it to .env.local:\n" +
      '   MONGODB_URI="mongodb+srv://<user>:<pass>@cluster.mongodb.net/<db>"'
  );
}

/* ── Global cache type augmentation ── */
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var _mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global._mongooseCache ?? {
  conn: null,
  promise: null,
};

if (!global._mongooseCache) {
  global._mongooseCache = cached;
}

/**
 * Returns a cached Mongoose connection.
 * Safe to call repeatedly — only the first invocation opens a socket.
 */
async function dbConnect(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI as string, {
      bufferCommands: false,
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null; // allow retry on transient failures
    throw err;
  }

  return cached.conn;
}

export default dbConnect;
