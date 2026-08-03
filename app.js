const express = require('express');
const { engine } = require('express-handlebars');
const mongoose = require('mongoose');
const session = require('express-session');
const flash = require('connect-flash');
const path = require('path');
const { isAuthenticated } = require('./middlewares/auth');
const { requireRole } = require('./middlewares/auth');

require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// ─── Production settings ──────────────────────────────
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1); // trust first proxy (CCSCloud / nginx)
}

// ─── Handlebars Setup ─────────────────────────────────
app.engine('hbs', engine({
  extname: 'hbs',
  defaultLayout: 'main',
  layoutsDir: path.join(__dirname, 'views/layouts'),
  partialsDir: path.join(__dirname, 'views/partials'),
  helpers: {
    eq: function (a, b) { return a === b; },
    formatDate: function (date) {
      if (!date) return '';
      var d = new Date(date);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
        ' ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    },
    formatCurrency: function (val) {
      if (val == null) return '0.00';
      return Number(val).toFixed(2);
    },
  },
}));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));
const hbs = require('hbs');


// ─── Middleware ───────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  if (req.method === 'POST' && req.body && req.body._method) {
    req.method = req.body._method.toUpperCase();
  }
  next();
});
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'views'))); 

// ─── Session ──────────────────────────────────────────
app.use(session({
  secret: process.env.SESSION_SECRET || 'ccdevap_skybook_secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  }
}));

// ─── Flash Messages ───────────────────────────────────
app.use(flash());

// ─── Make user + flash available in ALL views ─────────
app.use((req, res, next) => {
  res.locals.user = (req.session && req.session.user) ? req.session.user : null;
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  next();
});

// ─── MongoDB Connection ───────────────────────────────
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/skyEase')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// ─── Routes ───────────────────────────────────────────
const protectedRoutes = ['/profile', '/settings', '/admin/dashboard', '/admin/flights', '/admin/reservations', '/admin/audit-log'];
app.use(protectedRoutes, isAuthenticated);

// Member 1 - Auth routes (register, profile)
const authRoutes = require('./routes/authRoutes');
const indexRoutes = require('./routes/indexRoutes');
app.use('/', authRoutes);
app.use('/', indexRoutes);

// Member 2 - Flight routes (admin flight management)
const flightRoutes = require('./routes/flights');
app.use('/admin/flights', requireRole('admin'), (req, res, next) => {
  res.locals.layout = 'admin';
  next();
}, flightRoutes);

// Member 3 - Search and booking routes
const searchRoutes = require('./routes/searchRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
app.use('/', searchRoutes);
app.use('/', bookingRoutes);

// Member 4 - Reservation routes
const reservationRoutes = require('./routes/reservationRoutes');
app.use('/', reservationRoutes);

//For admin-user
const userRoutes = require('./routes/userRoutes');
app.use('/admin', (req, res, next) => {
  res.locals.layout = 'admin';
  next();
}, userRoutes);

// Audit Trail routes
const auditRoutes = require('./routes/auditRoutes');
app.use('/admin', (req, res, next) => {
  res.locals.layout = 'admin';
  next();
}, auditRoutes);

// ─── Legacy Static HTML Routes (from MCO1) ────────────
app.get('/admin',isAuthenticated, requireRole('admin'), (req, res) => {
  res.redirect('/admin/dashboard',);
});

// /admin/dashboard is handled by reservationController.getAdminDashboard (via reservationRoutes)

app.get('/admin/users',isAuthenticated, requireRole('admin'), (req, res) => {
  res.render('admin-users', { title: 'Admin Users', layout: 'admin' });
});


// /admin/reservations is handled by reservationController.getAdminReservations (via reservationRoutes)
app.get('/login', (req, res) => {
  res.render('login', { title: 'Login', layout: 'main' });
});

app.get('/register', (req, res) => {
  res.render('register', { title: 'Register', layout: 'main' });
});

app.get('/settings', (req, res) => {
  res.render('settings', { title: 'Settings', layout: 'main' });
});


module.exports = app;

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
}