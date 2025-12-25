import mongoose from 'mongoose';
import { env } from './env.js';

// MongoDB connection options
const options: mongoose.ConnectOptions = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

// Track connection status
let isConnected = false;

// Connect to MongoDB
export const connectDatabase = async (): Promise<typeof mongoose | null> => {
  try {
    const conn = await mongoose.connect(env.MONGO_URL, options);
    isConnected = true;
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.warn('⚠️ MongoDB connection failed. Running without database.');
    console.warn('   Install MongoDB or use MongoDB Atlas to enable database features.');
    console.warn(`   Error: ${(error as Error).message}`);
    isConnected = false;
    return null;
  }
};

// Check if database is connected
export const isDatabaseConnected = (): boolean => isConnected;

// Disconnect from MongoDB (for graceful shutdown)
export const disconnectDatabase = async (): Promise<void> => {
  if (!isConnected) return;
  try {
    await mongoose.disconnect();
    console.log('📤 MongoDB disconnected');
  } catch (error) {
    console.error('❌ MongoDB disconnect error:', error);
  }
};

// Connection event listeners
mongoose.connection.on('connected', () => {
  console.log('🔗 Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err);
});
