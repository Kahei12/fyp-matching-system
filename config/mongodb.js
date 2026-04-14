/**
 * MongoDB connection configuration
 * Direct connection using MongoDB Driver, more stable
 */

const { MongoClient } = require('mongodb');

// Read connection string from environment variables
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://fyp_user:fypmatchingsystem@fypmatching.j1hzf6h.mongodb.net/fyp_matching?retryWrites=true&w=majority';

let client = null;
let db = null;

// MongoDB Atlas TLS connection options - specifically for Windows SSL handshake issues
const clientOptions = {
    // Server selection timeout
    serverSelectionTimeoutMS: 30000,
    // Socket timeout
    socketTimeoutMS: 45000,
    // Connection pool
    maxPoolSize: 5,
    minPoolSize: 1,
    // Retry
    retryWrites: true,
    // TLS/SSL configuration
    tls: true,
    tlsAllowInvalidCertificates: true,
    tlsAllowInvalidHostnames: true,
    // Force TLS v1.2 (better compatibility)
    // tlsProtocol: 'TLSv1.2'
};

async function connectToMongoDB() {
    if (db) {
        return db; // already connected
    }

    try {
        console.log('Connecting to MongoDB Atlas...');

        client = new MongoClient(MONGO_URI, clientOptions);

        // Listen to connection events
        client.on('topologyDescriptionChanged', (event) => {
            console.log('Topology changed:', event.topologyDescription.type);
        });

        await client.connect();

        db = client.db('fyp_matching');
        console.log('MongoDB Atlas connected');

        // Test connection
        await db.command({ ping: 1 });
        console.log('Connection test successful');

        return db;
    } catch (error) {
        console.error('MongoDB connection failed:', error.message);
        console.log('Running in mock data mode');
        return null;
    }
}

async function getDB() {
    if (!db) {
        await connectToMongoDB();
    }
    return db;
}

async function closeConnection() {
    if (client) {
        await client.close();
        client = null;
        db = null;
        console.log('MongoDB connection closed');
    }
}

// Graceful shutdown
process.on('SIGINT', async () => {
    await closeConnection();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    await closeConnection();
    process.exit(0);
});

module.exports = {
    connectToMongoDB,
    getDB,
    closeConnection
};