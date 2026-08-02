const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/skyEase';

const seedUsers = [
  {
    name: 'Admin User',
    email: 'admin@skyease.com',
    password: 'Admin123!',
    passportNumber: 'ADM000001',
    role: 'admin',
  },
  {
    name: 'John Passenger',
    email: 'passenger@skyease.com',
    password: 'Passenger123!',
    passportNumber: 'PSG000001',
    role: 'passenger',
  },
];

const seedDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB connected for user seeding.');

    for (const userData of seedUsers) {
      // Skip if user already exists
      const existing = await User.findOne({ email: userData.email });
      if (existing) {
        console.log(`User "${userData.email}" already exists — skipped.`);
        continue;
      }

      // User.create triggers the pre-save bcrypt hook automatically
      await User.create(userData);
      console.log(`Created ${userData.role}: ${userData.email} (password: ${userData.password})`);
    }

    console.log('\nUser seeding complete!');
    console.log('──────────────────────────────────────');
    console.log('Admin login:     admin@skyease.com / Admin123!');
    console.log('Passenger login: passenger@skyease.com / Passenger123!');
    console.log('──────────────────────────────────────');

    mongoose.connection.close();
  } catch (error) {
    console.error('Error seeding users:', error);
    process.exit(1);
  }
};

seedDB();
