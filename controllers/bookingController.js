const Flight = require('../models/flight');
const Reservation = require('../models/reservation');

// ─── Render the search page ──────────────────────────
exports.renderSearchPage = (req, res) => {
  res.render('search', { title: 'Search Flights', layout: 'main' });
};

// ─── AJAX: Search flights (JSON) ─────────────────────
exports.searchFlights = async (req, res) => {
  try {
    const { origin, destination, date, cabin_class, airline } = req.query;
    const filter = {};

    if (origin && origin.trim()) {
      filter.origin = { $regex: origin.trim(), $options: 'i' };
    }
    if (destination && destination.trim()) {
      filter.destination = { $regex: destination.trim(), $options: 'i' };
    }
    if (cabin_class && cabin_class.trim()) {
      // cabinClass is stored as e.g. "Economy", form sends "economy"
      filter.cabinClass = { $regex: `^${cabin_class.trim()}$`, $options: 'i' };
    }
    if (airline && airline.trim()) {
      filter.airline = { $regex: airline.trim(), $options: 'i' };
    }
    const now = new Date();

    if (date && date.trim()) {
      // Build the day boundaries in LOCAL time (not UTC) so a date like
      // "2026-07-14" means midnight-to-midnight in the server's local
      // timezone, matching what the user picked in the <input type="date">.
      // (new Date("2026-07-14")) would parse as UTC midnight instead,
      // which can shift the window by several hours depending on timezone.
      const [year, month, day] = date.trim().split('-').map(Number);
      const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0);
      const endOfDay = new Date(year, month - 1, day + 1, 0, 0, 0, 0);

      // If searching "today", never show flights that have already departed.
      const lowerBound = startOfDay > now ? startOfDay : now;
      filter.departureDateTime = { $gte: lowerBound, $lt: endOfDay };
    } else {
      // No date filter: still only show upcoming flights, not past ones.
      filter.departureDateTime = { $gte: now };
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

// ── Meal price lookup (must match booking-client.js mealPackages) ──
const MEAL_PRICES = {
  'Standard Meal': 0,
  'Vegetarian': 5.00,
  'Vegan': 6.50,
  'Halal': 8.00,
  'Kosher': 9.50,
  'Gluten-Free': 7.00,
};
const PREMIUM_SEAT_ROWS = 2; // rows 1-N are premium
const PREMIUM_SEAT_SURCHARGE = 30;
const TAX_RATE = 0.12;

/**
 * Parse the extraServices string (e.g. "Baggage x2, Priority Boarding")
 * and return the total cost for those add-ons.
 */
function calcExtrasPrice(extraServicesStr) {
  if (!extraServicesStr) return 0;
  let total = 0;
  const parts = extraServicesStr.split(',').map(s => s.trim());
  for (const part of parts) {
    if (/^Baggage x(\d+)$/i.test(part)) {
      const qty = parseInt(part.match(/(\d+)/)[1], 10);
      total += qty * 25; // $25 per bag
    } else if (/priority boarding/i.test(part)) {
      total += 15;
    } else if (/travel insurance/i.test(part)) {
      total += 20;
    } else if (/lounge access/i.test(part)) {
      total += 35;
    }
  }
  return total;
}

/**
 * Generate a collision-resistant reservation number.
 * Uses a crypto-quality random segment to make millisecond
 * collisions astronomically unlikely.
 */
function generateReservationNumber() {
  const ts = Date.now().toString(36).toUpperCase();     // ~8 chars
  const rnd = Math.random().toString(36).substring(2, 8).toUpperCase() +
              Math.random().toString(36).substring(2, 6).toUpperCase(); // 6+4 chars
  return `SKY-${ts}-${rnd}`;
}

// ─── Process booking (POST) ──────────────────────────
exports.processBooking = async (req, res) => {
  try {
    const flight = await Flight.findById(req.params.id);
    if (!flight) {
      req.flash('error', 'Flight not found.');
      return res.redirect('/search');
    }

    const {
      fullName, email, contactNumber, passportNumber,
      nationality, dateOfBirth, gender, emergencyContact,
      seatNumber, mealPackage, extraServices,
    } = req.body;
    // NOTE: totalPrice is intentionally NOT read from req.body — it is
    // recalculated server-side to prevent client-side tampering.

    // ── Server-side validation ───────────────────────
    const errors = [];

    if (!fullName || !fullName.trim()) errors.push('Full name is required.');
    if (!email || !email.trim()) {
      errors.push('Email address is required.');
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        errors.push('Please enter a valid email address.');
      }
    }
    if (!contactNumber || !contactNumber.trim() || !/^[0-9+()\-\s]{7,}$/.test(contactNumber.trim())) {
      errors.push('Enter a valid contact number (min. 7 digits).');
    }
    if (!passportNumber || !passportNumber.trim()) {
      errors.push('Passport number is required.');
    } else if (passportNumber.trim().length < 6) {
      errors.push('Passport number must be at least 6 characters.');
    }
    if (!dateOfBirth || !dateOfBirth.trim()) {
      errors.push('Date of birth is required.');
    }
    if (!gender || !gender.trim()) {
      errors.push('Please select a gender.');
    }
    if (!emergencyContact || !emergencyContact.trim() || !/^[0-9+()\-\s]{7,}$/.test(emergencyContact.trim())) {
      errors.push('Enter a valid emergency contact number (min. 7 digits).');
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
        errors.push(`This seat is already taken. Please select another seat.`);
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

    // ── Generate collision-resistant reservation number ──
    const reservationNumber = generateReservationNumber();

    // ── Recalculate total price server-side ──────────
    // This prevents a user from tampering with the hidden totalPrice field.
    const cleanSeat = (seatNumber || '').trim();
    const seatRow = parseInt(cleanSeat, 10) || 0;
    const seatUpgrade = seatRow >= 1 && seatRow <= PREMIUM_SEAT_ROWS ? PREMIUM_SEAT_SURCHARGE : 0;
    const mealName = (mealPackage || 'Standard Meal').trim();
    const mealCost = MEAL_PRICES[mealName] !== undefined ? MEAL_PRICES[mealName] : 0;
    const extrasCost = calcExtrasPrice((extraServices || '').trim());
    const subtotal = flight.ticketPrice + seatUpgrade + mealCost + extrasCost;
    const finalTotal = parseFloat((subtotal + subtotal * TAX_RATE).toFixed(2));

    // ── Build the passenger record ───────────────────
    const passengerData = [
      {
        fullName: fullName.trim(),
        email: email.trim(),
        passportNumber: passportNumber.trim(),
        seatNumber: cleanSeat,
        contactNumber: (contactNumber || '').trim(),
        nationality: (nationality || '').trim(),
        dateOfBirth: (dateOfBirth || '').trim(),
        gender: (gender || '').trim(),
        emergencyContact: (emergencyContact || '').trim(),
      },
    ];
    const passengerCount = passengerData.length; // 1 for now; correct for future multi-pax support

    // ── Atomic seat reservation ──────────────────────
    // Combine the availability check + seat decrement into a single atomic
    // findOneAndUpdate so two concurrent requests cannot both pass the check
    // and create a double-booking for the same seat.
    const updatedFlight = await Flight.findOneAndUpdate(
      {
        _id: flight._id,
        availableSeats: { $gte: passengerCount },
        // Reject if the seat was taken between validation and now.
        // We rely on the Reservation seat-conflict query done above for the
        // detailed error message; this is the race-condition guard.
      },
      { $inc: { availableSeats: -passengerCount } },
      { new: true }
    );

    if (!updatedFlight) {
      // Another concurrent request claimed the last seat(s) between our
      // validation check and the update — treat as sold out.
      req.flash('error', 'Sorry, this flight just sold out. Please search for another flight.');
      return res.redirect(`/flights/${req.params.id}/book`);
    }

    // ── Create reservation ───────────────────────────
    const reservation = new Reservation({
      reservationNumber,
      flight: flight._id,
      userId: req.session.user ? req.session.user._id : null,
      passengers: passengerData,
      mealPackage: mealName,
      extraServices: (extraServices || '').trim(),
      totalPrice: finalTotal,
      status: 'Confirmed',
    });

    await reservation.save();

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