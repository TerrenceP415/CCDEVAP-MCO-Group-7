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

    // Validate input
    if (!email || !password) {
      req.flash('error', 'Email and password are required.');
      return res.redirect('/login');
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      req.flash('error', 'Invalid email or password.');
      return res.redirect('/login');
    }

    // Compare password
    const match = await user.comparePassword(password);
    if (!match) {
      req.flash('error', 'Invalid email or password.');
      return res.redirect('/login');
    }

    // Set user session
    req.session.user = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role || 'passenger'
    };

    // Redirect to the originally requested page or profile
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

    // Check if the email is already registered
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      req.flash('error', 'Email already in use.');
      return res.redirect('/register');
    }

    // Create a new user
    await User.create({
      name: fullName.trim(),
      email: email.toLowerCase().trim(),
      password,
      passportNumber: passportNumber ? passportNumber.trim() : ''
    });

    // Redirect to login after successful registration
    req.flash('success', 'Account created successfully!');
    return res.redirect('/login');
  } catch (err) {
    console.log(err);
    req.flash('error', 'Something went wrong. Please try again.');
    return res.redirect('/register');
  }
};

// Handle logout
exports.logout = (req, res) => {
  req.session.destroy((err) => {
    // Clear the session and redirect to login
    if (err) {
      console.error('logout error:', err);
      req.flash('error', 'Unable to log out right now.');
      return res.redirect('/profile');
    }
// Clear the session cookie
    res.clearCookie('connect.sid');
    req.flash('success', 'You have been logged out.');
    return res.redirect('/login');
  });
};

// Show profile from the current session
exports.getProfile = async (req, res) => {
  // Ensure the user is authenticated
  try {
    const currentUser = req.session.user;
    if (!currentUser) {
      return res.redirect('/login');
    }
// Fetch the user from the database to ensure we have the latest data
    const user = await User.findById(currentUser._id).lean();
    if (!user) {
      req.flash('error', 'User not found.');
      return res.redirect('/login');
    }
// Remove sensitive information before rendering
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
  // Ensure the user is authenticated
  try {
    const currentUser = req.session.user;
    if (!currentUser) {
      return res.redirect('/login');
    }
// Validate input
    if (!fullName) {
      return res.render('profile', { title: 'Profile', error: 'Name is required.' });
    }
// Update the user in the database
    const user = await User.findByIdAndUpdate(
      currentUser._id,
      { name: fullName.trim(), passportNumber: passportNumber ? passportNumber.trim() : '' },
      { new: true }
    ).lean();
// Check if the user was found and updated
    if (!user) {
      req.flash('error', 'User not found.');
      return res.redirect('/login');
    }
// Update the session with the new user data
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
