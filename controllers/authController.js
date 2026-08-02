// controllers/authController.js
const User = require('../models/User');
const { logActivity } = require('../utils/auditLogger');

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
      fullName: user.name,
      email: user.email,
      role: user.role || 'passenger'
    };

    // Audit trail: User Login
    await logActivity({
      username: user.email,
      userRole: user.role || 'passenger',
      activity: 'User Login',
      details: `User ${user.name} logged in`
    });

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

    // Audit trail: User Registration
    await logActivity({
      username: email.toLowerCase().trim(),
      userRole: 'passenger',
      activity: 'User Registration',
      details: `New account created for ${fullName.trim()}`
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
exports.logout = async (req, res) => {
  // Check if req.session exists to prevent errors
  if (!req.session) {
    return res.redirect('/login');
  }

  // Capture user info before destroying session
  const sessionUser = req.session.user;

  // Audit trail: User Logout (must run before session.destroy)
  if (sessionUser) {
    await logActivity({
      username: sessionUser.email || sessionUser.name,
      userRole: sessionUser.role || 'passenger',
      activity: 'User Logout',
      details: `User ${sessionUser.name} logged out`
    });
  }

  req.session.destroy((err) => {
    if (err) {
      console.error('logout error:', err);
      return res.redirect('/profile');
    }

    // Clear the session cookie
    res.clearCookie('connect.sid', { path: '/' });

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
    user.fullName = user.name || user.fullName || '';
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
    user.fullName = user.name || user.fullName || '';
    req.session.user.name = user.name;
    req.session.user.fullName = user.name;
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
