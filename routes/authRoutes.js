const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { isLoggedIn } = require('../middlewares/authMiddleware');

router.get('/register', authController.getRegister);
router.post('/register', authController.postRegister);

router.get('/login', authController.getLogin);
router.post('/login', authController.postLogin);

router.get('/logout', authController.logout);

router.get('/profile', isLoggedIn, authController.getProfile);
router.post('/profile', isLoggedIn, authController.updateProfile);

module.exports = router;