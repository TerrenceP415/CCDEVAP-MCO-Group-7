const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/reservationController');

// Admin reservation routes
router.get('/admin/reservations', reservationController.getAdminReservations);
router.post('/admin/reservations/create', reservationController.createAdminReservations);
router.put('/admin/reservations/update/:id', reservationController.updateAdminReservations);
router.delete('/admin/reservations/delete/:id', reservationController.deleteAdminReservations);
///router.get('/admin/dashboard', reservationController.getAdminDashboard);

module.exports = router;