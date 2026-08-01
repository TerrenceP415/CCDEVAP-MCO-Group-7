const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.user) {
    return next();
  }

  req.session.returnTo = req.originalUrl;
  req.flash('error', 'Please log in to continue.');
  return res.redirect('/login');
};

module.exports = {
  isAuthenticated,
};