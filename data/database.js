const { MongoClient } = require('mongodb');

let database;

async function connectDB() {
    if (database) {
        return database;
    }

    if (!process.env.MONGODB_URI || !process.env.MONGODB_DB) {
        throw new Error('Missing MongoDB settings in .env');
    }

    const client = new MongoClient(process.env.MONGODB_URI);

    try {
        await client.connect();

        const db = client.db(process.env.MONGODB_DB);
        await db.command({ ping:1 });
        
        database = db;
        console.log(`Connected to MongoDB: ${database.databaseName}`);

        return database;
    } catch (error) {
        await client.close();
        throw error;
    }
}

function getDB() {
    if (!database) {
        throw new Error('Database connection has not been initialized');
    }

    return database;
}

module.exports = { connectDB, getDB };