const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/reservationController');

// Admin reservation routes
router.get('/admin/reservations', reservationController.getAdminReservations);
router.post('/admin/reservations/create', reservationController.createAdminReservations);
///router.get('/admin/dashboard', reservationController.getAdminDashboard);

module.exports = router;