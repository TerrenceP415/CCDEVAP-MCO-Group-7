const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.get('/register', authController.getRegister);
router.post('/register', authController.postRegister);

router.get('/login', authController.getLogin);
router.post('/login', authController.postLogin);

router.get('/profile', authController.getProfile);
router.post('/profile', authController.updateProfile);

module.exports = router;
