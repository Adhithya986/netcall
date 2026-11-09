import mongoose from 'mongoose';
import { config } from '../config';

let mongodInstance: any = null;

export async function connectDB(): Promise<typeof mongoose> {
  // If explicitly requested or in test mode, try in-memory server first
  if (config.mongodb.useInMemory) {
    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      mongodInstance = await MongoMemoryServer.create();
      const inMemoryUri = mongodInstance.getUri();
      console.log(`[Database] Using in-memory MongoDB at ${inMemoryUri}`);
      return await mongoose.connect(inMemoryUri);
    } catch (inMemErr) {
      console.warn('[Database] In-memory MongoDB failed to start, falling back to configured URI...', inMemErr);
    }
  }

  try {
    console.log(`[Database] Attempting connection to MongoDB at: ${config.mongodb.uri}`);
    const conn = await mongoose.connect(config.mongodb.uri, {
      serverSelectionTimeoutMS: 4000
    });
    console.log('[Database] Connected to external MongoDB successfully.');
    return conn;
  } catch (error) {
    console.warn('[Database] Could not connect to external MongoDB. Attempting fallback to MongoMemoryServer...');
    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      mongodInstance = await MongoMemoryServer.create();
      const fallbackUri = mongodInstance.getUri();
      console.log(`[Database] Fallback in-memory MongoDB initialized at: ${fallbackUri}`);
      return await mongoose.connect(fallbackUri);
    } catch (fallbackError) {
      console.error('[Database] Fatal: Unable to initialize any MongoDB connection.', fallbackError);
      throw error;
    }
  }
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
  if (mongodInstance) {
    await mongodInstance.stop();
    mongodInstance = null;
  }
  console.log('[Database] Disconnected from MongoDB.');
}
