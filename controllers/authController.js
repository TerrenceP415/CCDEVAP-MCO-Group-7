const User = require('../models/User');
const bcrypt = require('bcrypt');

// Show register page
exports.getRegister = (req, res) => {
  res.render('register', { title: 'Register' });
};

// Handle registration
exports.postRegister = async (req, res) => {
  const { fullName, email, password, passportNumber } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      req.flash('error', 'Email already in use.');
      return res.redirect('/register');
    }
    await User.create({ fullName, email, password, passportNumber });
    req.flash('success', 'Account created! Please log in.');
    res.redirect('/login');
  } catch (err) {
    req.flash('error', 'Something went wrong.');
    res.redirect('/register');
  }
};

// Show login page
exports.getLogin = (req, res) => {
  res.render('login', { title: 'Login' });
};

// Handle login
exports.postLogin = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      req.flash('error', 'Invalid email or password.');
      return res.redirect('/login');
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      req.flash('error', 'Invalid email or password.');
      return res.redirect('/login');
    }
    req.session.user = {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role
    };
    if (user.role === 'admin') return res.redirect('/admin/dashboard');
    res.redirect('/search');
  } catch (err) {
    req.flash('error', 'Something went wrong.');
    res.redirect('/login');
  }
};

// Logout
exports.logout = (req, res) => {
  req.session.destroy();
  res.redirect('/login');
};

// Show profile
exports.getProfile = async (req, res) => {
  const user = await User.findById(req.session.user.id);
  res.render('profile', { title: 'My Profile', user });
};

// Update profile
exports.updateProfile = async (req, res) => {
  const { fullName, passportNumber } = req.body;
  try {
    await User.findByIdAndUpdate(req.session.user.id, { fullName, passportNumber });
    req.session.user.fullName = fullName;
    req.flash('success', 'Profile updated successfully.');
    res.redirect('/profile');
  } catch (err) {
    req.flash('error', 'Failed to update profile.');
    res.redirect('/profile');
  }
};