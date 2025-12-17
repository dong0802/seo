/**
 * Database Connection (MongoDB)
 * =============================
 * Secure MongoDB connection with best practices
 */

const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/seo-express';

// Connection options
const connectionOptions = {
    // Connection pool
    maxPoolSize: 10,
    minPoolSize: 2,

    // Timeouts
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,

    // Keep alive
    heartbeatFrequencyMS: 10000,

    // Retry
    retryWrites: true,
    retryReads: true,
};

// Connection state
let isConnected = false;

/**
 * Connect to MongoDB
 */
const connectDB = async () => {
    if (isConnected) {
        console.log('📦 Using existing MongoDB connection');
        return;
    }

    try {
        const conn = await mongoose.connect(MONGODB_URI, connectionOptions);

        isConnected = true;
        console.log(`✅ MongoDB connected: ${conn.connection.host}`);

        // Handle connection events
        mongoose.connection.on('error', (err) => {
            console.error('❌ MongoDB error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.warn('⚠️ MongoDB disconnected');
            isConnected = false;
        });

        mongoose.connection.on('reconnected', () => {
            console.log('🔄 MongoDB reconnected');
            isConnected = true;
        });

        // Graceful shutdown
        process.on('SIGINT', async () => {
            await mongoose.connection.close();
            console.log('📦 MongoDB connection closed through app termination');
            process.exit(0);
        });

        return conn;
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
};

/**
 * Disconnect from MongoDB
 */
const disconnectDB = async () => {
    if (!isConnected) return;

    try {
        await mongoose.connection.close();
        isConnected = false;
        console.log('📦 MongoDB disconnected');
    } catch (error) {
        console.error('❌ MongoDB disconnect error:', error);
    }
};

/**
 * Check connection status
 */
const isDBConnected = () => {
    return isConnected && mongoose.connection.readyState === 1;
};

/**
 * Get database instance
 */
const getDB = () => {
    return mongoose.connection.db;
};

module.exports = {
    connectDB,
    disconnectDB,
    isDBConnected,
    getDB,
    mongoose,
};
