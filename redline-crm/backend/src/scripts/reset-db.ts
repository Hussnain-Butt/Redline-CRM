import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGO_URL;

if (!MONGODB_URI) {
    console.error('❌ MONGO_URL not found in .env');
    process.exit(1);
}

const resetDatabase = async () => {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected.');

        const collections = await mongoose.connection.db?.collections();

        if (!collections || collections.length === 0) {
            console.log('⚠️ No collections found to clear.');
        } else {
            console.log(`🗑️ Found ${collections.length} collections. Clearing data...`);
            
            for (const collection of collections) {
                // Drop the collection completely
                await collection.drop();
                console.log(`   - Dropped ${collection.collectionName}`);
            }
        }

        console.log('✨ Database completely cleaned!');
        console.log('🌱 "New Tables" (Collections) will be automatically recreated when you restart the backend and add data.');

    } catch (error) {
        console.error('❌ Error resetting database:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
};

resetDatabase();
