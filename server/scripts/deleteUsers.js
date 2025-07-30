import mongoose from 'mongoose';
import User from '../models/User.js';
import connectDB from '../config/database.js';
import dotenv from 'dotenv';

dotenv.config();

const deleteUsers = async () => {
  try {
    await connectDB();
    await User.deleteMany({});
    console.log('All users deleted');
    mongoose.connection.close();
  } catch (error) {
    console.error('Error deleting users:', error);
    mongoose.connection.close();
  }
};

deleteUsers();
