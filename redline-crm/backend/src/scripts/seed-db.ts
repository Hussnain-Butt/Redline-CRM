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

// List of collections to create
const COLLECTIONS = [
    'contacts',
    'internal_dnc',
    'dnc_uploads',
    'settings',
    'calls',
    'reminders',
    'users',
    'scheduledcalls',
    'sms',
    'dnc_lists',
    'contactnotes',
    'templates',
    'conversations',
    'leads',
    'leadfolders',
    'emails',
    'phonenumbers'
];

const seedDatabase = async () => {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected.');

        console.log('🏗️  Creating collections (Tables)...');
        
        for (const collectionName of COLLECTIONS) {
            try {
                // Check if collection exists
                const collections = await mongoose.connection.db?.listCollections({ name: collectionName }).toArray();
                
                if (collections && collections.length > 0) {
                     console.log(`   - Collection '${collectionName}' already exists.`);
                } else {
                     await mongoose.connection.createCollection(collectionName);
                     console.log(`   + Created '${collectionName}'`);
                }

            } catch (err: any) {
                console.error(`   ❌ Failed to create '${collectionName}':`, err.message);
            }
        }

        console.log('✨ Database structure initialized successfully!');
        console.log('📝 All tables are ready for data.');

    } catch (error) {
        console.error('❌ Error seeding database:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
};

seedDatabase();
