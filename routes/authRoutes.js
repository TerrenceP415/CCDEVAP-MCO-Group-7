const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { isAuthenticated } = require('../middlewares/auth');

router.get('/register', authController.getRegister);
router.post('/register', authController.postRegister);

router.get('/login', authController.getLogin);
router.post('/login', authController.postLogin);
router.get('/logout', authController.logout);

router.get('/profile', isAuthenticated, authController.getProfile);
router.post('/profile', isAuthenticated, authController.updateProfile);

module.exports = router;
