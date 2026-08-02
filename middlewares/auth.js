
/**
 * Middleware to check if the user is authenticated
 */
const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.user) {
    return next();
  }

  req.session.returnTo = req.originalUrl;
  req.flash('error', 'Please log in to continue.');
  return res.redirect('/login');
};

/**
 * Middleware to check if the user has the required role
 */
function requireRole(role) {
  return function (req, res, next) {
    if (req.session.user.role === role) {
      return next();
    }
    
    return res.redirect('/');
  };
}

module.exports = {
  isAuthenticated,
  requireRole,
};