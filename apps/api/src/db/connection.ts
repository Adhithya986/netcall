import mongoose from 'mongoose';
import { config } from '../config';

let isInMemoryMode = false;

export function isDatabaseInMemory(): boolean {
  return isInMemoryMode || mongoose.connection.readyState !== 1;
}

export async function connectDB(): Promise<typeof mongoose | null> {
  // If explicitly requested or in test mode without external URI
  if (config.mongodb.useInMemory) {
    console.log('[Database] USE_IN_MEMORY_DB=true. Activated NetCall Zero-Dependency In-Memory Database.');
    isInMemoryMode = true;
    return null;
  }

  try {
    console.log(`[Database] Attempting connection to MongoDB at: ${config.mongodb.uri} (timeout: 2s)...`);
    const conn = await mongoose.connect(config.mongodb.uri, {
      serverSelectionTimeoutMS: 2000
    });
    console.log('[Database] Connected to external MongoDB successfully.');
    isInMemoryMode = false;
    return conn;
  } catch (error) {
    console.warn('[Database] External MongoDB is not running locally.');
    console.log('[Database] 🚀 Activated NetCall Zero-Dependency In-Memory Database. Ready immediately.');
    isInMemoryMode = true;
    return null;
  }
}

export async function disconnectDB(): Promise<void> {
  if (mongoose.connection.readyState === 1) {
    await mongoose.disconnect();
    console.log('[Database] Disconnected from MongoDB.');
  }
}
