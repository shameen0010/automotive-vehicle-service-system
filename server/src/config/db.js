import mongoose from 'mongoose';

export const connectDB = async (uri) => {
  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(uri);
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    console.error('Please make sure MongoDB is running on localhost:27017');
    console.error('To start MongoDB:');
    console.error('  - On Windows: net start MongoDB');
    console.error('  - On macOS: brew services start mongodb-community');
    console.error('  - On Linux: sudo systemctl start mongod');
    process.exit(1);
  }
};
