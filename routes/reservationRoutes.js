const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/reservationController');

// Admin reservation routes
router.get('/admin/reservations', reservationController.getAdminReservations);
router.post('/admin/reservations/create', reservationController.createAdminReservations);
router.put('/admin/reservations/update/:id', reservationController.updateAdminReservations);
router.delete('/admin/reservations/delete/:id', reservationController.deleteAdminReservations);

// Admin dashboard route
router.get('/admin/dashboard', reservationController.getAdminDashboard);

// User reservation routes
router.get('/my-reservations', reservationController.getUserReservations);
router.patch('/reservations/cancel/:id', reservationController.cancelUserReservation);
router.put('/reservations/update/:id', reservationController.updateUserReservations);

module.exports = router;