const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { isAuthenticated } = require('../middlewares/auth');

// Flight details page
router.get('/flights/:id', bookingController.flightDetails);

// Booking form (requires login)
router.get('/flights/:id/book', isAuthenticated, bookingController.renderBookingForm);

// Process booking (requires login)
router.post('/flights/:id/book', isAuthenticated, bookingController.processBooking);

// AJAX: get taken seats for a flight
router.get('/api/flights/:id/seats', bookingController.getTakenSeats);

module.exports = router;

