const express = require('express');
const { engine } = require('express-handlebars');
const mongoose = require('mongoose');
const session = require('express-session');
const flash = require('connect-flash');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// ─── Handlebars Setup ─────────────────────────────────
app.engine('hbs', engine({
  extname: 'hbs',
  defaultLayout: 'main',
  layoutsDir: path.join(__dirname, 'views/layouts'),
  partialsDir: path.join(__dirname, 'views/partials')
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
  secret: 'ccdevap_skybook_secret',
  resave: false,
  saveUninitialized: false
}));

// ─── Flash Messages ───────────────────────────────────
app.use(flash());

// ─── Make user + flash available in ALL views ─────────
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  next();
});

// ─── MongoDB Connection ───────────────────────────────
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/skyEase')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// ─── Routes ───────────────────────────────────────────

// Member 1 - Auth routes (register, profile)
const authRoutes = require('./routes/authRoutes');
app.use('/', authRoutes);

// Member 2 - Flight routes (admin flight management)
const flightRoutes = require('./routes/flights');
app.use('/admin/flights', flightRoutes);

// Member 3 - Search and booking routes
// const bookingRoutes = require('./routes/bookingRoutes');
// app.use('/', bookingRoutes);

// Member 4 - Reservation routes
// const reservationRoutes = require('./routes/reservationRoutes');
// app.use('/', reservationRoutes);

// ─── Legacy Static HTML Routes (from MCO1) ────────────
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.get('/admin', (req, res) => {
  res.redirect('/admin/dashboard');
});

app.get('/admin/dashboard', (req, res) => {
  res.render('admin-dashboard', { title: 'Admin Dashboard' });
});

app.get('/admin/flights', (req, res) => {
  res.redirect('/admin/flights');
});

app.get('/admin/flights.html', (req, res) => {
  res.redirect('/admin/flights');
});

app.get('/admin/flight', (req, res) => {
  res.redirect('/admin/flights');
});

app.get('/admin-flight.html', (req, res) => {
  res.redirect('/admin/flights');
});



app.get('/my-reservations', (req, res) => {
  res.render('reservations', { title: 'My Reservations' });
});
app.get('/admin/reservations', (req, res) => {
  res.render('admin-reservations', { title: 'Admin Reservations' });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});