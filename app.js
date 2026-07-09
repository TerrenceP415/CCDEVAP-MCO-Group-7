const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const handlebars = require('handlebars');

const flightRoutes = require('./routes/flights');

const app = express();
const port = process.env.PORT || 3000;

// MongoDB connection
mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/skyEase', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static assets
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'views')));

// Handlebars view engine
app.engine('hbs', handlebars.__express);
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

// Mount admin flight routes
app.use('/admin/flights', flightRoutes);

// Existing static HTML routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.get('/search', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'search.html'));
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});