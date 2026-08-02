const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/auth');

// Template View Interface Endpoint
router.get('/users', authMiddleware.isAuthenticated, authMiddleware.requireRole('passenger'), userController.getAdminUsersPage);

// CRUD Data Pipeline Endpoints
router.post('/api/users', authMiddleware.isAuthenticated, authMiddleware.requireRole('passenger'), userController.createUser);
router.put('/api/users/:id', authMiddleware.isAuthenticated, authMiddleware.requireRole('passenger'), userController.updateUser);
router.delete('/api/users/:id', authMiddleware.isAuthenticated, authMiddleware.requireRole('passenger'), userController.deleteUser);

module.exports = router;