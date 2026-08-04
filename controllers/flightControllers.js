const Flight = require('../models/flight');
const { logActivity } = require('../utils/auditLogger');

exports.index = async (req, res) => {
  try {
    // Fetch all flights and sort by departureDateTime
    const flights = await Flight.find().sort({ departureDateTime: 1 }).lean();
    res.render('admin-flights', {
      title: 'Admin Flights',
      flights,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Unable to load flights');
  }
};

exports.createFlight = async (req, res) => {
  // Validate and create a new flight
  try {
    const {
      flightNumber,
      airline,
      origin,
      destination,
      departureDateTime,
      arrivalDateTime,
      availableSeats,
      totalSeats,
      ticketPrice,
      duration,
      layovers,
      airlineLogo,
    } = req.body;

    if (new Date(departureDateTime) >= new Date(arrivalDateTime)) {
      return res.status(400).send('Departure must be before arrival');
    }

    const existingFlight = await Flight.findOne({ flightNumber });
    if (existingFlight) {
      return res.status(400).send('A flight with that number already exists');
    }

    const flight = new Flight({
      flightNumber,
      airline,
      origin,
      destination,
      departureDateTime,
      arrivalDateTime,
      availableSeats,
      totalSeats,
      ticketPrice,
      duration: duration || '',
      layovers: layovers || 0,
      airlineLogo: airlineLogo || '',
    });

    await flight.save();

    // Audit trail: Flight Created
    if (req.session && req.session.user) {
      await logActivity({
        username: req.session.user.email || req.session.user.name,
        userRole: req.session.user.role || 'admin',
        activity: 'Flight Created',
        details: `Flight ${flightNumber} created (${origin} → ${destination})`
      });
    }

    res.redirect('/admin/flights');
  } catch (err) {
    console.error('Create flight error:', err);
    const message = err.name === 'ValidationError'
      ? Object.values(err.errors).map(e => e.message).join(', ')
      : err.message || 'Could not create flight';
    res.status(500).send(message);
  }
};

exports.updateFlight = async (req, res) => {
  // Validate and update an existing flight
  try {
    const {
      flightNumber,
      airline,
      origin,
      destination,
      departureDateTime,
      arrivalDateTime,
      availableSeats,
      totalSeats,
      ticketPrice,
      duration,
      layovers,
      airlineLogo,
    } = req.body;

    // Validate required fields
    if (!flightNumber || !airline || !origin || !destination || !departureDateTime || !arrivalDateTime) {
      return res.status(400).json({ success: false, message: 'Please fill in all required fields.' });
    }

    if (new Date(departureDateTime) >= new Date(arrivalDateTime)) {
      return res.status(400).json({ success: false, message: 'Departure must be before arrival.' });
    }

    // Check for duplicate flight number, excluding the current flight
    const duplicate = await Flight.findOne({
      flightNumber,
      _id: { $ne: req.params.id },
    });
    if (duplicate) {
      return res.status(400).json({ success: false, message: 'A flight with that number already exists.' });
    }

      // Update the flight in the database
    const flight = await Flight.findByIdAndUpdate(
      req.params.id,
      {
        flightNumber,
        airline,
        origin,
        destination,
        departureDateTime,
        arrivalDateTime,
        availableSeats,
        totalSeats,
        ticketPrice,
        duration: duration || '',
        layovers: layovers || 0,
        airlineLogo: airlineLogo || '',
      },
      { returnDocument: 'after', runValidators: true }
    );

    if (!flight) {
      return res.status(404).json({ success: false, message: 'Flight not found.' });
    }

    // Audit trail: Flight Updated
    if (req.session && req.session.user) {
      await logActivity({
        username: req.session.user.email || req.session.user.name,
        userRole: req.session.user.role || 'admin',
        activity: 'Flight Updated',
        details: `Flight ${flightNumber} updated`
      });
    }

    res.json({ success: true, message: 'Flight updated successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Could not update flight.' });
  }
};

exports.deleteFlight = async (req, res) => {
  try {
    const flight = await Flight.findByIdAndDelete(req.params.id);
    if (!flight) {
      return res.status(404).json({ success: false, message: 'Flight not found' });
    }

    // Audit trail: Flight Deleted
    if (req.session && req.session.user) {
      await logActivity({
        username: req.session.user.email || req.session.user.name,
        userRole: req.session.user.role || 'admin',
        activity: 'Flight Deleted',
        details: `Flight ${flight.flightNumber} deleted`
      });
    }

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Could not delete flight' });
  }
}