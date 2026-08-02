const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { isAuthenticated } = require('../middlewares/auth');

// Define routes for authentication
router.get('/register', authController.getRegister);
router.post('/register', authController.postRegister);

// Define routes for login and logout
router.get('/login', authController.getLogin);
router.post('/login', authController.postLogin);
router.get('/logout', authController.logout);

// Define routes for profile management
router.get('/profile', isAuthenticated, authController.getProfile);
router.post('/profile', isAuthenticated, authController.updateProfile);

module.exports = router;
