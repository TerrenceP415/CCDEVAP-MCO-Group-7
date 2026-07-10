const Flight = require('../models/Flight');

exports.index = async (req, res) => {
  try {
    const flights = await Flight.find().sort({ departureDateTime: 1 }).lean();
    res.render('admin-flight', { flights });
  } catch (err) {
    console.error(err);
    res.status(500).send('Unable to load flights');
  }
};

exports.newFlightForm = (req, res) => {
  res.render('flight-form', {
    flight: {},
    action: '/admin/flights',
    method: 'POST',
  });
};

exports.createFlight = async (req, res) => {
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
  try {
    const flight = await Flight.findById(req.params.id);
    if (!flight) {
      return res.status(404).send('Flight not found');
    }

    res.render('flight-form', {
      flight,
      action: `/admin/flights/${flight._id}`,
      method: 'PUT',
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Unable to load flight for editing');
  }
};

exports.updateFlight = async (req, res) => {
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

    const duplicate = await Flight.findOne({
      flightNumber,
      _id: { $ne: req.params.id },
    });
    if (duplicate) {
      return res.status(400).send('A flight with that number already exists');
    }

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
      { new: true, runValidators: true }
    );

    if (!flight) {
      return res.status(404).send('Flight not found');
    }

    res.redirect('/admin/flights');
  } catch (err) {
    console.error(err);
    res.status(500).send('Could not update flight');
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