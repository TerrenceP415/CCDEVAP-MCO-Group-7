const Flight = require('../models/flight');

// Helper function to format date for input[type="datetime-local"]
const formatDateTimeLocal = (value) => {
  if (!value) return '';
  const date = new Date(value);
  const pad = (num) => String(num).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

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

exports.newFlightForm = (req, res) => {
  // Render the flight form for creating a new flight
  res.render('flight-form', {
    title: 'Add Flight',
    flight: {},
    action: '/admin/flights',
    method: 'POST',
  });
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
    });

    await flight.save();
    res.redirect('/admin/flights');
  } catch (err) {
    console.error(err);
    res.status(500).send('Could not create flight');
  }
};

exports.editFlightForm = async (req, res) => {
  // Render the flight form for editing an existing flight
  try {
    const flight = await Flight.findById(req.params.id);
    if (!flight) {
      return res.status(404).send('Flight not found');
    }

  // Render the flight form with existing flight data
    res.render('flight-form', {
      title: 'Edit Flight',
      flight,
      action: `/admin/flights/${flight._id}`,
      method: 'PUT',
      departureDateTimeValue: formatDateTimeLocal(flight.departureDateTime),
      arrivalDateTimeValue: formatDateTimeLocal(flight.arrivalDateTime),
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Unable to load flight for editing');
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
      },
      { returnDocument: 'after', runValidators: true }
    );

    if (!flight) {
      return res.status(404).json({ success: false, message: 'Flight not found.' });
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

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Could not delete flight' });
  }
}