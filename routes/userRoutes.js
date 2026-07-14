const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Template View Interface Endpoint
router.get('/users', userController.getAdminUsersPage);

// CRUD Data Pipeline Endpoints
router.post('/api/users', userController.createUser);
router.put('/api/users/:id', userController.updateUser);
router.delete('/api/users/:id', userController.deleteUser);

module.exports = router;