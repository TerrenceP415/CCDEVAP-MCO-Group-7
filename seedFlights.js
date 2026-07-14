const mongoose = require('mongoose');
require('dotenv').config();
const Flight = require('./models/flight'); // Ensure the path is correct
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/skyEase';
const sampleFlights = [
  {
    flightNumber: 'PR101',
    airline: 'Philippine Airlines',
    origin: 'MNL',
    destination: 'NRT',
    departureDateTime: new Date(new Date().getTime() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
    arrivalDateTime: new Date(new Date().getTime() + 2 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000), // 4 hours flight
    availableSeats: 150,
    totalSeats: 150,
    ticketPrice: 250.00
  },
  {
    flightNumber: '5J501',
    airline: 'Cebu Pacific',
    origin: 'MNL',
    destination: 'SIN',
    departureDateTime: new Date(new Date().getTime() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
    arrivalDateTime: new Date(new Date().getTime() + 3 * 24 * 60 * 60 * 1000 + 3.5 * 60 * 60 * 1000), // 3.5 hours flight
    availableSeats: 180,
    totalSeats: 180,
    ticketPrice: 120.50
  },
  {
    flightNumber: 'SQ910',
    airline: 'Singapore Airlines',
    origin: 'SIN',
    destination: 'MNL',
    departureDateTime: new Date(new Date().getTime() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    arrivalDateTime: new Date(new Date().getTime() + 5 * 24 * 60 * 60 * 1000 + 3.5 * 60 * 60 * 1000), // 3.5 hours flight
    availableSeats: 50,
    totalSeats: 200,
    ticketPrice: 300.00
  },
  {
    flightNumber: 'JL745',
    airline: 'Japan Airlines',
    origin: 'NRT',
    destination: 'MNL',
    departureDateTime: new Date(new Date().getTime() + 6 * 24 * 60 * 60 * 1000), // 6 days from now
    arrivalDateTime: new Date(new Date().getTime() + 6 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000), // 4 hours flight
    availableSeats: 80,
    totalSeats: 220,
    ticketPrice: 400.00
  },
  {
    flightNumber: 'PR202',
    airline: 'Philippine Airlines',
    origin: 'MNL',
    destination: 'CEB',
    departureDateTime: new Date(new Date().getTime() + 1 * 24 * 60 * 60 * 1000), // 1 day from now
    arrivalDateTime: new Date(new Date().getTime() + 1 * 24 * 60 * 60 * 1000 + 1.5 * 60 * 60 * 1000), // 1.5 hours flight
    availableSeats: 100,
    totalSeats: 100,
    ticketPrice: 50.00
  },
  {
    flightNumber: 'Z2777',
    airline: 'AirAsia Zest',
    origin: 'MNL',
    destination: 'SIN',
    departureDateTime: new Date(new Date().getTime() + 3 * 60 * 60 * 1000), // 3 hours from now (today)
    arrivalDateTime: new Date(new Date().getTime() + 6.5 * 60 * 60 * 1000), // 6.5 hours from now
    availableSeats: 120,
    totalSeats: 150,
    ticketPrice: 145.00
  },
  {
    flightNumber: 'PR102',
    airline: 'Philippine Airlines',
    origin: 'MNL',
    destination: 'LAX',
    departureDateTime: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    arrivalDateTime: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000 + 13 * 60 * 60 * 1000), // 13 hours flight
    availableSeats: 250,
    totalSeats: 300,
    ticketPrice: 850.00
  }
];
const seedDB = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB connected successfully for seeding.');
    // Clear previous sample flights based on flightNumber to avoid duplicate key errors
    const flightNumbers = sampleFlights.map(f => f.flightNumber);
    await Flight.deleteMany({ flightNumber: { $in: flightNumbers } });
    console.log('Cleared existing sample flights.');
    // Insert new sample flights
    await Flight.insertMany(sampleFlights);
    console.log('Successfully seeded database with sample flights!');
    // Close the connection
    mongoose.connection.close();
    console.log('MongoDB connection closed.');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};
seedDB();