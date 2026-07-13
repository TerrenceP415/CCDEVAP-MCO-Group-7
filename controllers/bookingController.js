const Flight = require('../models/flight');
const Reservation = require('../models/reservation');

// ─── Render the search page ──────────────────────────
exports.renderSearchPage = (req, res) => {
  res.render('search', { title: 'Search Flights', layout: 'main' });
};

// ─── AJAX: Search flights (JSON) ─────────────────────
exports.searchFlights = async (req, res) => {
  try {
    const { origin, destination, date } = req.query;
    const filter = {};

    if (origin && origin.trim()) {
      filter.origin = { $regex: origin.trim(), $options: 'i' };
    }
    if (destination && destination.trim()) {
      filter.destination = { $regex: destination.trim(), $options: 'i' };
    }
    if (date && date.trim()) {
      // Match flights departing on the given date (any time that day)
      const startOfDay = new Date(date.trim());
      const endOfDay = new Date(date.trim());
      endOfDay.setDate(endOfDay.getDate() + 1);
      filter.departureDateTime = { $gte: startOfDay, $lt: endOfDay };
    }

    const flights = await Flight.find(filter)
      .sort({ departureDateTime: 1 })
      .lean();

    res.json({ success: true, flights });
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ success: false, message: 'Server error searching flights.' });
  }
};

// ─── Flight details page ─────────────────────────────
exports.flightDetails = async (req, res) => {
  try {
    const flight = await Flight.findById(req.params.id).lean();
    if (!flight) {
      req.flash('error', 'Flight not found.');
      return res.redirect('/search');
    }
    res.render('flight-details', {
      title: `Flight ${flight.flightNumber}`,
      layout: 'main',
      flight,
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Could not load flight details.');
    res.redirect('/search');
  }
};

// ─── Render booking form ─────────────────────────────
exports.renderBookingForm = async (req, res) => {
  try {
    const flight = await Flight.findById(req.params.id).lean();
    if (!flight) {
      req.flash('error', 'Flight not found.');
      return res.redirect('/search');
    }
    if (flight.availableSeats <= 0) {
      req.flash('error', 'This flight is fully booked.');
      return res.redirect(`/flights/${req.params.id}`);
    }
    res.render('booking', {
      title: 'Book Flight',
      layout: 'main',
      flight,
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Could not load booking form.');
    res.redirect('/search');
  }
};

// ─── Process booking (POST) ──────────────────────────
exports.processBooking = async (req, res) => {
  try {
    const flight = await Flight.findById(req.params.id);
    if (!flight) {
      req.flash('error', 'Flight not found.');
      return res.redirect('/search');
    }

    const { fullName, email, passportNumber, seatNumber } = req.body;

    // ── Server-side validation ───────────────────────
    const errors = [];

    if (!fullName || !fullName.trim()) errors.push('Full name is required.');
    if (!email || !email.trim()) {
      errors.push('Email address is required.');
    } else {
      // Basic email format check
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        errors.push('Please enter a valid email address.');
      }
    }
    if (!passportNumber || !passportNumber.trim()) {
      errors.push('Passport number is required.');
    } else if (passportNumber.trim().length < 6) {
      errors.push('Passport number must be at least 6 characters.');
    }
    if (!seatNumber || !seatNumber.trim()) errors.push('Please select a seat.');

    // Flight availability check
    if (flight.availableSeats <= 0) {
      errors.push('This flight has no available seats.');
    }

    // Seat availability check — make sure no other reservation has this seat
    if (seatNumber && seatNumber.trim()) {
      const seatTaken = await Reservation.findOne({
        flight: flight._id,
        status: { $ne: 'Cancelled' },
        'passengers.seatNumber': seatNumber.trim(),
      });
      if (seatTaken) {
        errors.push(`Seat ${seatNumber.trim()} is already taken.`);
      }
    }

    if (errors.length > 0) {
      const flightLean = flight.toObject();
      return res.render('booking', {
        title: 'Book Flight',
        layout: 'main',
        flight: flightLean,
        errors,
        body: req.body,
      });
    }

    // ── Generate reservation number ──────────────────
    const reservationNumber = 'SKY-' + Date.now().toString(36).toUpperCase() +
      '-' + Math.random().toString(36).substring(2, 6).toUpperCase();

    // ── Create reservation ───────────────────────────
    const reservation = new Reservation({
      reservationNumber,
      flight: flight._id,
      userId: req.session.user ? req.session.user._id : null,
      passengers: [
        {
          fullName: fullName.trim(),
          email: email.trim(),
          passportNumber: passportNumber.trim(),
          seatNumber: seatNumber.trim(),
        },
      ],
      totalPrice: flight.ticketPrice,
      status: 'Confirmed',
    });

    await reservation.save();

    // ── Decrement available seats ─────────────────────
    flight.availableSeats = Math.max(0, flight.availableSeats - 1);
    await flight.save();

    req.flash('success', `Booking confirmed! Your reservation number is ${reservationNumber}.`);
    res.redirect('/my-reservations');
  } catch (err) {
    console.error('Booking error:', err);
    req.flash('error', 'Something went wrong while processing your booking.');
    res.redirect(`/flights/${req.params.id}/book`);
  }
};

// ─── AJAX: Get taken seats for a flight (JSON) ───────
exports.getTakenSeats = async (req, res) => {
  try {
    const reservations = await Reservation.find({
      flight: req.params.id,
      status: { $ne: 'Cancelled' },
    }).lean();

    // Collect all occupied seat numbers
    const takenSeats = [];
    reservations.forEach((r) => {
      if (r.passengers && r.passengers.length > 0) {
        r.passengers.forEach((p) => {
          if (p.seatNumber) takenSeats.push(p.seatNumber);
        });
      }
    });

    res.json({ success: true, takenSeats });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Could not load seat data.' });
  }
};
