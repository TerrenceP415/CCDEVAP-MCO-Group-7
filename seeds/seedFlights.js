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
  },
  {
    flightNumber: 'PR300',
    airline: 'Philippine Airlines',
    origin: 'MNL',
    destination: 'DVO',
    departureDateTime: new Date(new Date().getTime() + 1 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
    arrivalDateTime: new Date(new Date().getTime() + 1 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000),
    availableSeats: 140,
    totalSeats: 160,
    ticketPrice: 65.00
  },
  {
    flightNumber: '5J620',
    airline: 'Cebu Pacific',
    origin: 'MNL',
    destination: 'ICN',
    departureDateTime: new Date(new Date().getTime() + 2 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000),
    arrivalDateTime: new Date(new Date().getTime() + 2 * 24 * 60 * 60 * 1000 + 12 * 60 * 60 * 1000),
    availableSeats: 190,
    totalSeats: 200,
    ticketPrice: 175.00
  },
  {
    flightNumber: 'CX906',
    airline: 'Cathay Pacific',
    origin: 'MNL',
    destination: 'HKG',
    departureDateTime: new Date(new Date().getTime() + 4 * 24 * 60 * 60 * 1000),
    arrivalDateTime: new Date(new Date().getTime() + 4 * 24 * 60 * 60 * 1000 + 2.5 * 60 * 60 * 1000),
    availableSeats: 95,
    totalSeats: 180,
    ticketPrice: 210.00
  },
  {
    flightNumber: 'TG621',
    airline: 'Thai Airways',
    origin: 'MNL',
    destination: 'BKK',
    departureDateTime: new Date(new Date().getTime() + 4 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000),
    arrivalDateTime: new Date(new Date().getTime() + 4 * 24 * 60 * 60 * 1000 + 8.5 * 60 * 60 * 1000),
    availableSeats: 110,
    totalSeats: 220,
    ticketPrice: 235.00
  },
  {
    flightNumber: 'NH870',
    airline: 'All Nippon Airways',
    origin: 'MNL',
    destination: 'HND',
    departureDateTime: new Date(new Date().getTime() + 5 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
    arrivalDateTime: new Date(new Date().getTime() + 5 * 24 * 60 * 60 * 1000 + 6.5 * 60 * 60 * 1000),
    availableSeats: 130,
    totalSeats: 200,
    ticketPrice: 420.00
  },
  {
    flightNumber: 'PR426',
    airline: 'Philippine Airlines',
    origin: 'MNL',
    destination: 'KIX',
    departureDateTime: new Date(new Date().getTime() + 3 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000),
    arrivalDateTime: new Date(new Date().getTime() + 3 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000),
    availableSeats: 105,
    totalSeats: 170,
    ticketPrice: 310.00
  },
  {
    flightNumber: 'BR272',
    airline: 'EVA Air',
    origin: 'MNL',
    destination: 'TPE',
    departureDateTime: new Date(new Date().getTime() + 2 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000),
    arrivalDateTime: new Date(new Date().getTime() + 2 * 24 * 60 * 60 * 1000 + 12.5 * 60 * 60 * 1000),
    availableSeats: 160,
    totalSeats: 190,
    ticketPrice: 195.00
  },
  {
    flightNumber: 'EK337',
    airline: 'Emirates',
    origin: 'MNL',
    destination: 'DXB',
    departureDateTime: new Date(new Date().getTime() + 6 * 24 * 60 * 60 * 1000 + 7 * 60 * 60 * 1000),
    arrivalDateTime: new Date(new Date().getTime() + 6 * 24 * 60 * 60 * 1000 + 16 * 60 * 60 * 1000),
    availableSeats: 280,
    totalSeats: 350,
    ticketPrice: 680.00
  },
  {
    flightNumber: 'QF020',
    airline: 'Qantas',
    origin: 'MNL',
    destination: 'SYD',
    departureDateTime: new Date(new Date().getTime() + 8 * 24 * 60 * 60 * 1000),
    arrivalDateTime: new Date(new Date().getTime() + 8 * 24 * 60 * 60 * 1000 + 8.5 * 60 * 60 * 1000),
    availableSeats: 210,
    totalSeats: 260,
    ticketPrice: 790.00
  },
  {
    flightNumber: '5J803',
    airline: 'Cebu Pacific',
    origin: 'MNL',
    destination: 'DPS',
    departureDateTime: new Date(new Date().getTime() + 5 * 24 * 60 * 60 * 1000 + 1 * 60 * 60 * 1000),
    arrivalDateTime: new Date(new Date().getTime() + 5 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000),
    availableSeats: 145,
    totalSeats: 180,
    ticketPrice: 160.00
  },
  {
    flightNumber: 'PR104',
    airline: 'Philippine Airlines',
    origin: 'MNL',
    destination: 'SFO',
    departureDateTime: new Date(new Date().getTime() + 9 * 24 * 60 * 60 * 1000),
    arrivalDateTime: new Date(new Date().getTime() + 9 * 24 * 60 * 60 * 1000 + 12.5 * 60 * 60 * 1000),
    availableSeats: 220,
    totalSeats: 300,
    ticketPrice: 890.00
  },
  {
    flightNumber: 'PR126',
    airline: 'Philippine Airlines',
    origin: 'MNL',
    destination: 'JFK',
    departureDateTime: new Date(new Date().getTime() + 10 * 24 * 60 * 60 * 1000),
    arrivalDateTime: new Date(new Date().getTime() + 10 * 24 * 60 * 60 * 1000 + 16 * 60 * 60 * 1000),
    availableSeats: 175,
    totalSeats: 280,
    ticketPrice: 1050.00
  },
  {
    flightNumber: 'PR730',
    airline: 'Philippine Airlines',
    origin: 'MNL',
    destination: 'BNE',
    departureDateTime: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
    arrivalDateTime: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000 + 11 * 60 * 60 * 1000),
    availableSeats: 130,
    totalSeats: 200,
    ticketPrice: 720.00
  },
  {
    flightNumber: '5J571',
    airline: 'Cebu Pacific',
    origin: 'CEB',
    destination: 'SIN',
    departureDateTime: new Date(new Date().getTime() + 3 * 24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000),
    arrivalDateTime: new Date(new Date().getTime() + 3 * 24 * 60 * 60 * 1000 + 12.5 * 60 * 60 * 1000),
    availableSeats: 165,
    totalSeats: 180,
    ticketPrice: 130.00
  },
  {
    flightNumber: 'Z2888',
    airline: 'AirAsia Zest',
    origin: 'MNL',
    destination: 'BKK',
    departureDateTime: new Date(new Date().getTime() + 2 * 24 * 60 * 60 * 1000 + 11 * 60 * 60 * 1000),
    arrivalDateTime: new Date(new Date().getTime() + 2 * 24 * 60 * 60 * 1000 + 14.5 * 60 * 60 * 1000),
    availableSeats: 140,
    totalSeats: 180,
    ticketPrice: 115.00
  },
  {
    flightNumber: 'PR2815',
    airline: 'Philippine Airlines',
    origin: 'MNL',
    destination: 'DGT',
    departureDateTime: new Date(new Date().getTime() + 1 * 24 * 60 * 60 * 1000 + 7 * 60 * 60 * 1000),
    arrivalDateTime: new Date(new Date().getTime() + 1 * 24 * 60 * 60 * 1000 + 8.5 * 60 * 60 * 1000),
    availableSeats: 85,
    totalSeats: 120,
    ticketPrice: 58.00
  },
  {
    flightNumber: '5J389',
    airline: 'Cebu Pacific',
    origin: 'MNL',
    destination: 'USM',
    departureDateTime: new Date(new Date().getTime() + 4 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
    arrivalDateTime: new Date(new Date().getTime() + 4 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000),
    availableSeats: 115,
    totalSeats: 150,
    ticketPrice: 185.00
  },
  {
    flightNumber: 'CI702',
    airline: 'China Airlines',
    origin: 'MNL',
    destination: 'TPE',
    departureDateTime: new Date(new Date().getTime() + 5 * 24 * 60 * 60 * 1000 + 9 * 60 * 60 * 1000),
    arrivalDateTime: new Date(new Date().getTime() + 5 * 24 * 60 * 60 * 1000 + 11.5 * 60 * 60 * 1000),
    availableSeats: 150,
    totalSeats: 210,
    ticketPrice: 205.00
  },
  {
    flightNumber: 'SQ917',
    airline: 'Singapore Airlines',
    origin: 'MNL',
    destination: 'SIN',
    departureDateTime: new Date(new Date().getTime() + 6 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
    arrivalDateTime: new Date(new Date().getTime() + 6 * 24 * 60 * 60 * 1000 + 7.5 * 60 * 60 * 1000),
    availableSeats: 195,
    totalSeats: 250,
    ticketPrice: 290.00
  },
  {
    flightNumber: 'PR507',
    airline: 'Philippine Airlines',
    origin: 'MNL',
    destination: 'SIN',
    departureDateTime: new Date(new Date().getTime() + 3 * 24 * 60 * 60 * 1000 + 1 * 60 * 60 * 1000),
    arrivalDateTime: new Date(new Date().getTime() + 3 * 24 * 60 * 60 * 1000 + 4.5 * 60 * 60 * 1000),
    availableSeats: 160,
    totalSeats: 180,
    ticketPrice: 215.00
  },
  {
    flightNumber: 'TR387',
    airline: 'Scoot',
    origin: 'MNL',
    destination: 'SIN',
    departureDateTime: new Date(new Date().getTime() + 2 * 24 * 60 * 60 * 1000 + 15 * 60 * 60 * 1000),
    arrivalDateTime: new Date(new Date().getTime() + 2 * 24 * 60 * 60 * 1000 + 18.5 * 60 * 60 * 1000),
    availableSeats: 170,
    totalSeats: 200,
    ticketPrice: 105.00
  },
  {
    flightNumber: '5J963',
    airline: 'Cebu Pacific',
    origin: 'MNL',
    destination: 'BKI',
    departureDateTime: new Date(new Date().getTime() + 4 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000),
    arrivalDateTime: new Date(new Date().getTime() + 4 * 24 * 60 * 60 * 1000 + 12 * 60 * 60 * 1000),
    availableSeats: 125,
    totalSeats: 150,
    ticketPrice: 98.00
  },
  {
    flightNumber: 'PR2132',
    airline: 'Philippine Airlines',
    origin: 'CEB',
    destination: 'MNL',
    departureDateTime: new Date(new Date().getTime() + 1 * 24 * 60 * 60 * 1000 + 12 * 60 * 60 * 1000),
    arrivalDateTime: new Date(new Date().getTime() + 1 * 24 * 60 * 60 * 1000 + 13.5 * 60 * 60 * 1000),
    availableSeats: 110,
    totalSeats: 140,
    ticketPrice: 52.00
  },
  {
    flightNumber: 'Z2350',
    airline: 'AirAsia Zest',
    origin: 'MNL',
    destination: 'TAG',
    departureDateTime: new Date(new Date().getTime() + 2 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
    arrivalDateTime: new Date(new Date().getTime() + 2 * 24 * 60 * 60 * 1000 + 4.2 * 60 * 60 * 1000),
    availableSeats: 135,
    totalSeats: 160,
    ticketPrice: 48.00
  },
  {
    flightNumber: 'PR116',
    airline: 'Philippine Airlines',
    origin: 'MNL',
    destination: 'YVR',
    departureDateTime: new Date(new Date().getTime() + 11 * 24 * 60 * 60 * 1000),
    arrivalDateTime: new Date(new Date().getTime() + 11 * 24 * 60 * 60 * 1000 + 12 * 60 * 60 * 1000),
    availableSeats: 210,
    totalSeats: 290,
    ticketPrice: 930.00
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
