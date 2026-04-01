import { MongoClient, MongoClientOptions } from "mongodb";

/**
 * Raw MongoClient Singleton
 *
 * Auth.js's MongoDB Adapter requires a raw `MongoClient` (not Mongoose).
 * This module provides a cached client promise, following the same
 * hot-reload-safe pattern as lib/mongodb.ts.
 */

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    "❌ MONGODB_URI is not defined. Add it to .env.local:\n" +
      '   MONGODB_URI="mongodb+srv://<user>:<pass>@cluster.mongodb.net/<db>"'
  );
}

const options: MongoClientOptions = {};

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "development") {
  // In dev, cache on global so hot-reloads don't create new connections
  if (!global._mongoClientPromise) {
    const client = new MongoClient(MONGODB_URI, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production, module scope is sufficient
  const client = new MongoClient(MONGODB_URI, options);
  clientPromise = client.connect();
}

export default clientPromise;
