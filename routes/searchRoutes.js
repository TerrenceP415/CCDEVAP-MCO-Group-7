const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');

// Search page
router.get('/search', bookingController.renderSearchPage);

// Results page (redirected to from the search form; loads flights via AJAX)
router.get('/results', bookingController.renderResultsPage);

// AJAX flight search API
router.get('/api/flights/search', bookingController.searchFlights);

module.exports = router;