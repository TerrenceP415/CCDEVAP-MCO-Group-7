const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');

// Flight details page
router.get('/flights/:id', bookingController.flightDetails);

// Booking form
router.get('/flights/:id/book', bookingController.renderBookingForm);

// Process booking
router.post('/flights/:id/book', bookingController.processBooking);

// AJAX: get taken seats for a flight
router.get('/api/flights/:id/seats', bookingController.getTakenSeats);

module.exports = router;
