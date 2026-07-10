const User = require('../models/User');

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
      return res.render('register', {
        title: 'Register',
        error: 'Email already in use.',
        body: req.body
      });
    }
    await User.create({ fullName, email, password, passportNumber });
    res.render('register', {
      title: 'Register',
      success: 'Account created successfully!'
    });
  } catch (err) {
    console.log(err);
    res.render('register', {
      title: 'Register',
      error: 'Something went wrong. Please try again.'
    });
  }
};

// Show profile (by email lookup)
exports.getProfile = async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.render('profile', { title: 'Profile' });
    const user = await User.findOne({ email });
    if (!user) return res.render('profile', { title: 'Profile', error: 'User not found.' });
    res.render('profile', { title: 'Profile', user });
  } catch (err) {
    console.log(err);
    res.render('profile', { title: 'Profile', error: 'Something went wrong.' });
  }
};

// Update profile
exports.updateProfile = async (req, res) => {
  const { email, fullName, passportNumber } = req.body;
  try {
    const user = await User.findOneAndUpdate(
      { email },
      { fullName, passportNumber },
      { new: true }
    );
    res.render('profile', {
      title: 'Profile',
      user,
      success: 'Profile updated successfully.'
    });
  } catch (err) {
    console.log(err);
    res.render('profile', { title: 'Profile', error: 'Failed to update profile.' });
  }
};