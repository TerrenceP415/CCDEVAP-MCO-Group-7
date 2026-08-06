const mongoose = require('mongoose');
require('dotenv').config();
const Flight = require('../models/flight');

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
    availableSeats: 120,
    totalSeats: 140,
    ticketPrice: 120.50
  },
  {
    flightNumber: 'SQ910',
    airline: 'Singapore Airlines',
    origin: 'SIN',
    destination: 'MNL',
    departureDateTime: new Date(new Date().getTime() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    arrivalDateTime: new Date(new Date().getTime() + 5 * 24 * 60 * 60 * 1000 + 3.5 * 60 * 60 * 1000), // 3.5 hours flight
    availableSeats: 45,
    totalSeats: 130,
    ticketPrice: 300.00
  },
  {
    flightNumber: 'JL745',
    airline: 'Japan Airlines',
    origin: 'NRT',
    destination: 'MNL',
    departureDateTime: new Date(new Date().getTime() + 6 * 24 * 60 * 60 * 1000), // 6 days from now
    arrivalDateTime: new Date(new Date().getTime() + 6 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000), // 4 hours flight
    availableSeats: 70,
    totalSeats: 140,
    ticketPrice: 400.00
  },
  {
    flightNumber: 'PR202',
    airline: 'Philippine Airlines',
    origin: 'MNL',
    destination: 'CEB',
    departureDateTime: new Date(new Date().getTime() + 1 * 24 * 60 * 60 * 1000), // 1 day from now
    arrivalDateTime: new Date(new Date().getTime() + 1 * 24 * 60 * 60 * 1000 + 1.5 * 60 * 60 * 1000), // 1.5 hours flight
    availableSeats: 90,
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
    availableSeats: 100,
    totalSeats: 120,
    ticketPrice: 145.00
  },
  {
    flightNumber: 'PR102',
    airline: 'Philippine Airlines',
    origin: 'MNL',
    destination: 'LAX',
    departureDateTime: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    arrivalDateTime: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000 + 13 * 60 * 60 * 1000), // 13 hours flight
    availableSeats: 130,
    totalSeats: 150,
    ticketPrice: 850.00
  },
  {
    flightNumber: 'PR300',
    airline: 'Philippine Airlines',
    origin: 'MNL',
    destination: 'DVO',
    departureDateTime: new Date(new Date().getTime() + 1 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
    arrivalDateTime: new Date(new Date().getTime() + 1 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000),
    availableSeats: 110,
    totalSeats: 130,
    ticketPrice: 65.00
  },
  {
    flightNumber: '5J620',
    airline: 'Cebu Pacific',
    origin: 'MNL',
    destination: 'ICN',
    departureDateTime: new Date(new Date().getTime() + 2 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000),
    arrivalDateTime: new Date(new Date().getTime() + 2 * 24 * 60 * 60 * 1000 + 12 * 60 * 60 * 1000),
    availableSeats: 125,
    totalSeats: 145,
    ticketPrice: 175.00
  },
  {
    flightNumber: 'CX906',
    airline: 'Cathay Pacific',
    origin: 'MNL',
    destination: 'HKG',
    departureDateTime: new Date(new Date().getTime() + 4 * 24 * 60 * 60 * 1000),
    arrivalDateTime: new Date(new Date().getTime() + 4 * 24 * 60 * 60 * 1000 + 2.5 * 60 * 60 * 1000),
    availableSeats: 80,
    totalSeats: 135,
    ticketPrice: 210.00
  },
  {
    flightNumber: 'TG621',
    airline: 'Thai Airways',
    origin: 'MNL',
    destination: 'BKK',
    departureDateTime: new Date(new Date().getTime() + 4 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000),
    arrivalDateTime: new Date(new Date().getTime() + 4 * 24 * 60 * 60 * 1000 + 8.5 * 60 * 60 * 1000),
    availableSeats: 95,
    totalSeats: 140,
    ticketPrice: 235.00
  },
  {
    flightNumber: 'NH870',
    airline: 'All Nippon Airways',
    origin: 'MNL',
    destination: 'HND',
    departureDateTime: new Date(new Date().getTime() + 5 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
    arrivalDateTime: new Date(new Date().getTime() + 5 * 24 * 60 * 60 * 1000 + 6.5 * 60 * 60 * 1000),
    availableSeats: 100,
    totalSeats: 145,
    ticketPrice: 420.00
  },
  {
    flightNumber: 'EK337',
    airline: 'Emirates',
    origin: 'MNL',
    destination: 'DXB',
    departureDateTime: new Date(new Date().getTime() + 6 * 24 * 60 * 60 * 1000 + 7 * 60 * 60 * 1000),
    arrivalDateTime: new Date(new Date().getTime() + 6 * 24 * 60 * 60 * 1000 + 16 * 60 * 60 * 1000),
    availableSeats: 125,
    totalSeats: 150,
    ticketPrice: 680.00
  },
  {
    flightNumber: 'QF020',
    airline: 'Qantas',
    origin: 'MNL',
    destination: 'SYD',
    departureDateTime: new Date(new Date().getTime() + 8 * 24 * 60 * 60 * 1000),
    arrivalDateTime: new Date(new Date().getTime() + 8 * 24 * 60 * 60 * 1000 + 8.5 * 60 * 60 * 1000),
    availableSeats: 110,
    totalSeats: 145,
    ticketPrice: 790.00
  },
  {
    flightNumber: 'PR104',
    airline: 'Philippine Airlines',
    origin: 'MNL',
    destination: 'SFO',
    departureDateTime: new Date(new Date().getTime() + 9 * 24 * 60 * 60 * 1000),
    arrivalDateTime: new Date(new Date().getTime() + 9 * 24 * 60 * 60 * 1000 + 12.5 * 60 * 60 * 1000),
    availableSeats: 120,
    totalSeats: 150,
    ticketPrice: 890.00
  }
];

const seedDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB connected successfully for seeding.');

    // Clear previous sample flights based on flightNumber to avoid duplicate key errors
    const flightNumbers = sampleFlights.map(f => f.flightNumber);
    await Flight.deleteMany({ flightNumber: { $in: flightNumbers } });
    console.log('Cleared existing sample flights.');

    // Insert new sample flights
    await Flight.insertMany(sampleFlights);
    console.log('Successfully seeded database with sample flights!');

    mongoose.connection.close();
    console.log('MongoDB connection closed.');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDB();
