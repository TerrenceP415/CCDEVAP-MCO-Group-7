const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/reservationController');
const authMiddleware = require('../middlewares/auth');

// Admin reservation routes
router.get('/admin/reservations', authMiddleware.isAuthenticated, authMiddleware.requireRole('admin'), reservationController.getAdminReservations);
router.post('/admin/reservations/create', authMiddleware.isAuthenticated, authMiddleware.requireRole('admin'), reservationController.createAdminReservations);
router.put('/admin/reservations/update/:id', authMiddleware.isAuthenticated, authMiddleware.requireRole('admin'), reservationController.updateAdminReservations);
router.delete('/admin/reservations/delete/:id', authMiddleware.isAuthenticated, authMiddleware.requireRole('admin'), reservationController.deleteAdminReservations);

// Admin dashboard route
router.get('/admin/dashboard', authMiddleware.isAuthenticated, authMiddleware.requireRole('admin'), reservationController.getAdminDashboard);

// User reservation routes
router.get('/my-reservations', authMiddleware.isAuthenticated, reservationController.getUserReservations);
router.patch('/reservations/cancel/:id', authMiddleware.isAuthenticated, reservationController.cancelUserReservation);
router.put('/reservations/update/:id', authMiddleware.isAuthenticated, reservationController.updateUserReservations);
router.get('/admin/reservations/flight-lookup/:flightNumber', authMiddleware.isAuthenticated, authMiddleware.requireRole('admin'), reservationController.lookupFlightByNumber);

module.exports = router;