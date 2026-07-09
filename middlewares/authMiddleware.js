exports.isLoggedIn = (req, res, next) => {
  if (!req.session.user) {
    req.flash('error', 'Please log in first.');
    return res.redirect('/login');
  }
  next();
};

exports.isAdmin = (req, res, next) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    req.flash('error', 'Access denied.');
    return res.redirect('/login');
  }
  next();
};

exports.isPassenger = (req, res, next) => {
  if (!req.session.user || req.session.user.role !== 'passenger') {
    req.flash('error', 'Access denied.');
    return res.redirect('/login');
  }
  next();
};