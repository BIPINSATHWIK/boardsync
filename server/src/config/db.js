const mongoose = require('mongoose');
const { MONGO_URI } = require('./env');

const connect = async (retries = 5, delay = 3000) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await mongoose.connect(MONGO_URI, { dbName: 'boardsync' });
      console.log('MongoDB connected');
      return;
    } catch (err) {
      console.error(` MongoDB connection failed (attempt ${attempt}/${retries}):`, err.message);
      if (attempt < retries) {
        console.log(`   Retrying in ${delay / 1000}s...`);
        await new Promise((res) => setTimeout(res, delay));
      } else {
        console.error(' All MongoDB connection attempts failed. Exiting.');
        process.exit(1);
      }
    }
  }
};

const getStatus = () => {
  const states = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
  return states[mongoose.connection.readyState] || 'unknown';
};

module.exports = { connect, getStatus };
