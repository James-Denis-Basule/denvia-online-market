import mongoose from 'mongoose';
import env from './env.js';

async function connectDatabase(): Promise<void> {
  if (!env.mongoUri) {
    throw new Error('MONGODB_URI is not defined');
  }

  await mongoose.connect(env.mongoUri);

  console.log('MongoDB connected successfully');
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();

  console.log('MongoDB disconnected');
}

export default connectDatabase;