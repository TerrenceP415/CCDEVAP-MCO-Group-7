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

// ─── Middleware ───────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

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
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/   ')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// ─── Routes ───────────────────────────────────────────

// Member 1 - Auth routes (login, register, profile, logout)
const authRoutes = require('./routes/authRoutes');
app.use('/', authRoutes);

// Member 2 - Flight routes (admin flight management)

// Member 3 - Add search and booking routes here

// Member 4 - Add reservation routes here

// ─── Legacy Static HTML Routes (from MCO1) ────────────
// These will be replaced by .hbs versions as each member converts them
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});
app.get('/search', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'search.html'));
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});