// controllers/authController.js
const User = require('../models/User');

// GET /login
exports.getLogin = (req, res) => {
  if (req.session && req.session.user) {
    return res.redirect('/profile');
  }
  return res.render('login', { title: 'Login' });
};

// POST /login
exports.postLogin = async (req, res) => {
  try {
    const email = (req.body.email || '').toLowerCase().trim();
    const password = req.body.password || '';

    if (!email || !password) {
      req.flash('error', 'Email and password are required.');
      return res.redirect('/login');
    }

    const user = await User.findOne({ email });
    if (!user) {
      req.flash('error', 'Invalid email or password.');
      return res.redirect('/login');
    }

    const match = await user.comparePassword(password);
    if (!match) {
      req.flash('error', 'Invalid email or password.');
      return res.redirect('/login');
    }

    req.session.user = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role || 'passenger'
    };

    const redirectTo = req.session.returnTo || '/profile';
    delete req.session.returnTo;
    req.flash('success', 'Logged in successfully.');
    return res.redirect(redirectTo);
  } catch (err) {
    console.error('postLogin error:', err);
    req.flash('error', 'An error occurred. Please try again.');
    return res.redirect('/login');
  }
};

// Show register page
exports.getRegister = (req, res) => {
  res.render('register', { title: 'Register' });
};

// Handle registration
exports.postRegister = async (req, res) => {
  const { fullName, email, password, passportNumber } = req.body;
  try {
    if (!fullName || !email || !password) {
      req.flash('error', 'Name, email and password are required.');
      return res.redirect('/register');
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      req.flash('error', 'Email already in use.');
      return res.redirect('/register');
    }

    await User.create({
      name: fullName.trim(),
      email: email.toLowerCase().trim(),
      password,
      passportNumber: passportNumber ? passportNumber.trim() : ''
    });

    req.flash('success', 'Account created successfully!');
    return res.redirect('/login');
  } catch (err) {
    console.log(err);
    req.flash('error', 'Something went wrong. Please try again.');
    return res.redirect('/register');
  }
};

exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('logout error:', err);
      req.flash('error', 'Unable to log out right now.');
      return res.redirect('/profile');
    }

    res.clearCookie('connect.sid');
    req.flash('success', 'You have been logged out.');
    return res.redirect('/login');
  });
};

// Show profile from the current session
exports.getProfile = async (req, res) => {
  try {
    const currentUser = req.session.user;
    if (!currentUser) {
      return res.redirect('/login');
    }

    const user = await User.findById(currentUser._id).lean();
    if (!user) {
      req.flash('error', 'User not found.');
      return res.redirect('/login');
    }

    delete user.password;
    return res.render('profile', { title: 'Profile', user });
  } catch (err) {
    console.log(err);
    return res.render('profile', { title: 'Profile', error: 'Something went wrong.' });
  }
};

// Update profile from the current session
exports.updateProfile = async (req, res) => {
  const { fullName, passportNumber } = req.body;
  try {
    const currentUser = req.session.user;
    if (!currentUser) {
      return res.redirect('/login');
    }

    if (!fullName) {
      return res.render('profile', { title: 'Profile', error: 'Name is required.' });
    }

    const user = await User.findByIdAndUpdate(
      currentUser._id,
      { name: fullName.trim(), passportNumber: passportNumber ? passportNumber.trim() : '' },
      { new: true }
    ).lean();

    if (!user) {
      req.flash('error', 'User not found.');
      return res.redirect('/login');
    }

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
