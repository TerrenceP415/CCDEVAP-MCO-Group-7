const express = require('express');
const { engine } = require('express-handlebars');
const mongoose = require('mongoose');
const session = require('express-session');
const flash = require('connect-flash');
const path = require('path');
const app = express();
const port = 3000;

// Set public and views directories as static folders 
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'views')));


app.get('/', (req, res) => {
  //sends index.html from project/views folder via path.join
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.get('/search', (req, res) => {
  //sends search.html from project/views folder via path.join
  res.sendFile(path.join(__dirname, 'views', 'search.html'));
});


// Handlebars setup
app.engine('hbs', engine({
  extname: 'hbs',
  defaultLayout: 'main',
  layoutsDir: path.join(__dirname, 'views/layouts'),
  partialsDir: path.join(__dirname, 'views/partials')
}));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

// Middleware setup
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Session setup
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));

// Flash messages
app.use(flash());

// Make user and flash available in ALL views automatically
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  next();
});

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

// ─── Routes ───────────────────────────────────────────
const authRoutes = require('./routes/authRoutes');
app.use('/', authRoutes);

// Add routes here <------------------------------------


app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
