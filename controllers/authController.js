// controllers/authController.js
const User = require('../models/User');

// GET /login
exports.getLogin = (req, res) => {
  return res.render('login', { title: 'Login' });
};

// POST /login  (DB check only; no session/cookie)
exports.postLogin = async (req, res) => {
  try {
    const email = (req.body.email || '').toLowerCase().trim();
    const password = req.body.password || '';

    if (!email || !password) {
      return res.status(400).render('login', { title: 'Login', error: 'Email and password are required.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).render('login', { title: 'Login', error: 'Invalid email or password.' });
    }

    // Assumes User model has comparePassword method (bcrypt)
    const match = await user.comparePassword(password);
    if (!match) {
      return res.status(401).render('login', { title: 'Login', error: 'Invalid email or password.' });
    }

    // Success: professor asked to check DB but not enforce state.
    // You can either render a success page or redirect with a message.
    return res.render('login-success', { title: 'Login Success', message: 'Credentials validated (no session stored).' });
  } catch (err) {
    console.error('postLogin error:', err);
    return res.status(500).render('login', { title: 'Login', error: 'An error occurred. Please try again.' });
  }
};

// Show register page
exports.getRegister = (req, res) => {
  res.render('register', { title: 'Register' });
};

// Handle registration (store name consistently)
exports.postRegister = async (req, res) => {
  const { fullName, email, password, passportNumber } = req.body;
  try {
    if (!fullName || !email || !password) {
      return res.render('register', { title: 'Register', error: 'Name, email and password are required.', body: req.body });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.render('register', {
        title: 'Register',
        error: 'Email already in use.',
        body: req.body
      });
    }

    // Save using `name` field in DB for clarity
    await User.create({
      name: fullName.trim(),
      email: email.toLowerCase().trim(),
      password,
      passportNumber: passportNumber ? passportNumber.trim() : ''
    });

    return res.render('register', {
      title: 'Register',
      success: 'Account created successfully!'
    });
  } catch (err) {
    console.log(err);
    return res.render('register', {
      title: 'Register',
      error: 'Something went wrong. Please try again.'
    });
  }
};

// Show profile (by email lookup — no session enforcement)
exports.getProfile = async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.render('profile', { title: 'Profile' });

    const user = await User.findOne({ email: email.toLowerCase().trim() }).lean();
    if (!user) return res.render('profile', { title: 'Profile', error: 'User not found.' });

    // Remove sensitive fields before rendering
    delete user.password;
    return res.render('profile', { title: 'Profile', user });
  } catch (err) {
    console.log(err);
    return res.render('profile', { title: 'Profile', error: 'Something went wrong.' });
  }
};

// Update profile (identify by email in form body)
exports.updateProfile = async (req, res) => {
  const { email, fullName, passportNumber } = req.body;
  try {
    if (!email || !fullName) {
      return res.render('profile', { title: 'Profile', error: 'Email and name are required.' });
    }

    const user = await User.findOneAndUpdate(
      { email: email.toLowerCase().trim() },
      { name: fullName.trim(), passportNumber: passportNumber ? passportNumber.trim() : '' },
      { new: true }
    ).lean();

    if (!user) return res.render('profile', { title: 'Profile', error: 'User not found.' });

    delete user.password;
    return res.render('profile', {
      title: 'Profile',
      user,
      success: 'Profile updated successfully.'
    });
  } catch (err) {
    console.log(err);
    return res.render('profile', { title: 'Profile', error: 'Failed to update profile.' });
  }
};
