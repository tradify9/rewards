const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      console.log('⚠️  MONGO_URI not set. Running without database connection.');
      return;
    }

    mongoose.set('strictQuery', true);

    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000, // 10 sec timeout
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ MongoDB connection failed');
    console.error('Reason:', error.message);
    console.error('Error Name:', error.name);
    console.log('⚠️  Continuing without database connection for testing...');
  }
};

module.exports = connectDB;
