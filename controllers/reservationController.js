const Reservation = require('../models/reservation');
const Flight = require('../models/flight');


exports.getAdminReservations = async (req, res) => {
    try {
        const reservations = await Reservation.find()
            .populate('flight')
            .lean(); 
        
        const formattedReservations = reservations.map(resObj => {
            // Calculate seat string
            let seatDisplay = 'N/A';

            
            if (resObj.passengers && resObj.passengers.length > 0) {
                seatDisplay = resObj.passengers.map(p => p.seatNumber).join(', ');
            }

            return {
                ...resObj,
                seatDisplay,
                // Status check
                isConfirmed: resObj.status === 'Confirmed',
                isCancelled: resObj.status === 'Cancelled',
                isPending: resObj.status === 'Pending'
            };
        });

        res.render('admin-reservations', { 
            title: 'Admin Reservations',
            layout: 'admin', 
            reservations: formattedReservations 
        });

    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error loading data');
    }
};

// Look up a flight by its flight number - used by the admin reservation modal
// to auto-fill origin/destination/departure/arrival and to validate seat availability
// before a reservation is created or edited.
exports.lookupFlightByNumber = async (req, res) => {
    try {
        const { flightNumber } = req.params;
        if (!flightNumber || !flightNumber.trim()) {
            return res.status(400).json({ success: false, message: 'Flight number is required' });
        }

        const flight = await Flight.findOne({ flightNumber: flightNumber.trim() }).lean();
        if (!flight) {
            return res.status(404).json({ success: false, message: `No flight found with flight number "${flightNumber}"` });
        }

        res.status(200).json({ success: true, flight });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Error looking up flight' });
    }
};

// Helper: turns the raw newline/comma separated modal fields into a passengers array.
// Throws an Error with a user-facing message if the data doesn't line up.
function buildPassengersFromRequest({ passengerNames, passengerEmails, passengerPassports, seatNumber }) {
    const namesArray = (passengerNames || '').split('\n').map(n => n.trim()).filter(n => n.length > 0);
    const seatsArray = (seatNumber || '').split(',').map(s => s.trim()).filter(Boolean);
    const emailsArray = (passengerEmails || '').split('\n').map(e => e.trim()).filter(e => e.length > 0);
    const passportsArray = (passengerPassports || '').split('\n').map(p => p.trim()).filter(p => p.length > 0);

    if (namesArray.length === 0) {
        throw new Error('At least one passenger is required');
    }
    if (seatsArray.length !== namesArray.length) {
        throw new Error(`Please provide exactly ${namesArray.length} seat number(s) to match the passenger(s) listed`);
    }

    return namesArray.map((fullName, i) => ({
        fullName,
        email: emailsArray[i] || '',
        passportNumber: passportsArray[i] || '',
        seatNumber: seatsArray[i]
    }));
}

exports.createAdminReservations = async (req, res) => {
    try {
        const {
            reservationNumber, flightNumber, seatNumber, totalPrice, status,
            passengerNames, passengerEmails, passengerPassports,
            mealPackage, extraServices
        } = req.body;
        //validate flight exists
        if (!flightNumber || !flightNumber.trim()) {
            return res.status(400).send('Flight number is required');
        }

        const flight = await Flight.findOne({ flightNumber: flightNumber.trim() });
        if (!flight) {
            return res.status(404).send(`No flight found with flight number "${flightNumber}"`);
        }
        //gather passenger information
        let passengers;
        try {
            passengers = buildPassengersFromRequest({ passengerNames, passengerEmails, passengerPassports, seatNumber });
        } catch (validationErr) {
            return res.status(400).send(validationErr.message);
        }

        // validate the flight actually has enough open seats for this booking
        if (flight.availableSeats < passengers.length) {
            return res.status(400).send(`Only ${flight.availableSeats} seat(s) left on flight ${flight.flightNumber}`);
        }

        // Make sure none of the requested seats are already held on this flight
        const seatConflict = await Reservation.findOne({
            flight: flight._id,
            status: { $ne: 'Cancelled' },
            'passengers.seatNumber': { $in: passengers.map(p => p.seatNumber) }
        });
        if (seatConflict) {
            return res.status(400).send('One or more selected seats are already taken on this flight');
        }

        const cleanPrice = parseFloat(String(totalPrice).replace(/[^0-9.]/g, '')) || 0;

        const newReservation = new Reservation({
            reservationNumber,
            flight: flight._id,
            passengers,
            mealPackage,
            extraServices,
            totalPrice: cleanPrice,
            status
        });
        await newReservation.save();

        // If flight is cancelled, release the assigned seating
        if (status !== 'Cancelled') {
            flight.availableSeats -= passengers.length;
            await flight.save();
        }

        res.redirect('/admin/reservations');

    } catch (err) {
        console.error(err);
        res.status(500).send('Error creating reservation entry');
    }
};


exports.updateAdminReservations = async (req, res) => {
    try {
        const { id } = req.params;
        //clean and validate ID
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ success: false, message: 'Invalid reservation id' });
        }
        // get the following variables from req.body
        const {
            reservationNumber, flightNumber, seatNumber, totalPrice, status,
            passengerNames, passengerEmails, passengerPassports,
            mealPackage, extraServices
        } = req.body;
        //get the reservation by ID 
        const reservation = await Reservation.findById(id).populate('flight');
        if (!reservation) {
            return res.status(404).json({ success: false, message: 'Reservation not found' });
        }

        const oldFlight = reservation.flight; 
        const oldStatus = reservation.status;
        const oldPassengerCount = reservation.passengers.length;

        //validate old and new flight to match
        //new flight is the old flight after update
        let newFlight = oldFlight;
        if (!flightNumber || !flightNumber.trim()) {
            return res.status(400).json({ success: false, message: 'Flight number is required' });
        }
        if (!oldFlight || flightNumber.trim() !== oldFlight.flightNumber) {
            newFlight = await Flight.findOne({ flightNumber: flightNumber.trim() });
            if (!newFlight) {
                return res.status(404).json({ success: false, message: `No flight found with flight number "${flightNumber}"` });
            }
        }
        const flightChanged = !oldFlight || String(newFlight._id) !== String(oldFlight._id);

        //clean and apply passenger, seat, email, and passport data
        let passengers;
        try {
            passengers = buildPassengersFromRequest({ passengerNames, passengerEmails, passengerPassports, seatNumber });
        } catch (validationErr) {
            return res.status(400).json({ success: false, message: validationErr.message });
        }

        // How many seats this reservation currently occupies vs. will occupy after the update
        const oldOccupiedSeats = (oldFlight && oldStatus !== 'Cancelled') ? oldPassengerCount : 0;
        const newOccupiedSeats = status !== 'Cancelled' ? passengers.length : 0;

        // calculate the new amount of available seats for the newflight
        const seatsNeededFromNewFlight = flightChanged ? newOccupiedSeats : (newOccupiedSeats - oldOccupiedSeats);
        if (seatsNeededFromNewFlight > 0 && newFlight.availableSeats < seatsNeededFromNewFlight) {
            return res.status(400).json({ success: false, message: `Only ${newFlight.availableSeats} seat(s) left on flight ${newFlight.flightNumber}` });
        }

        // Make sure none of the requested seats are already held by someone else on the target flight
        if (newOccupiedSeats > 0) {
            const seatConflict = await Reservation.findOne({
                flight: newFlight._id,
                status: { $ne: 'Cancelled' },
                _id: { $ne: reservation._id },
                'passengers.seatNumber': { $in: passengers.map(p => p.seatNumber) }
            });
            if (seatConflict) {
                return res.status(400).json({ success: false, message: 'One or more selected seats are already taken on this flight' });
            }
        }

        const cleanPrice = parseFloat(String(totalPrice).replace(/[^0-9.]/g, '')) || 0;
        // reassign updated values to the reservation object
        reservation.reservationNumber = reservationNumber;
        reservation.flight = newFlight._id;
        reservation.passengers = passengers;
        reservation.mealPackage = mealPackage;
        reservation.extraServices = extraServices;
        reservation.totalPrice = cleanPrice;
        reservation.status = status;
        // save the updated reservation
        await reservation.save();

        // Reassign seat values
        if (flightChanged) {
            if (oldFlight && oldOccupiedSeats > 0) {
                oldFlight.availableSeats += oldOccupiedSeats;
                await oldFlight.save();
            }
            if (newOccupiedSeats > 0) {
                newFlight.availableSeats -= newOccupiedSeats;
                await newFlight.save();
            }
        } else if (seatsNeededFromNewFlight !== 0) {
            newFlight.availableSeats -= seatsNeededFromNewFlight;
            await newFlight.save();
        }

        const updated = await Reservation.findById(id).populate('flight').lean();
        const seatDisplay = updated.passengers && updated.passengers.length > 0
            ? updated.passengers.map(p => p.seatNumber).join(', ')
            : 'N/A';
 
        res.status(200).json({
            success: true,
            message: 'Reservation updated successfully',
            reservation: {
                ...updated,
                seatDisplay,
                isConfirmed: updated.status === 'Confirmed',
                isCancelled: updated.status === 'Cancelled',
                isPending: updated.status === 'Pending'
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Error updating reservation' });
    }
};

exports.deleteAdminReservations = async (req, res) => {
    try {

        const { id } = req.params;

        // Clean ID and validate it is a valid entry

        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ success: false, message: 'Invalid reservation id' });
        }
        // Attempt to delete the reservation by ID, returns the deleted document if found, or null if not found
        const deleted = await Reservation.findByIdAndDelete(id);
        if (!deleted) {
            return res.status(404).json({ success: false, message: 'Reservation not found' });
        }

        // Give the seats back to the flight, unless they were already released (Cancelled)
        if (deleted.flight && deleted.status !== 'Cancelled') {
            await Flight.findByIdAndUpdate(deleted.flight, {
                $inc: { availableSeats: deleted.passengers.length }
            });
        }

        res.status(200).json({ success: true, message: 'Reservation deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Error deleting reservation' });
    }
}

exports.getAdminDashboard = async (req, res) => {
    try {
        // Total bookings = every reservation on record, regardless of status
        const totalBookings = await Reservation.countDocuments();
 
        // Revenue and destination popularity should exclude cancelled reservations
        const revenueResult = await Reservation.aggregate([
            { $match: { status: { $ne: 'Cancelled' } } },
            { $group: { _id: null, total: { $sum: '$totalPrice' } } }
        ]);
        const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;
 
        const popularDestinations = await Reservation.aggregate([
            { $match: { status: { $ne: 'Cancelled' } } },
            {
                $lookup: {
                    from: 'flights',
                    localField: 'flight',
                    foreignField: '_id',
                    as: 'flightInfo'
                }
            },
            { $unwind: '$flightInfo' },
            {
                $group: {
                    _id: '$flightInfo.destination',
                    bookings: { $sum: 1 }
                }
            },
            { $sort: { bookings: -1 } },
            { $limit: 10 },
            {
                $project: {
                    _id: 0,
                    destination: '$_id',
                    bookings: 1
                }
            }
        ]);
 
        res.render('admin-dashboard', {
            title: 'Admin Dashboard',
            layout: 'admin',
            totalBookings,
            totalRevenue: totalRevenue.toFixed(2),
            popularDestinations
        });
 
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error loading dashboard data');
    }
};
 
exports.getUserReservations = async (req, res) => {

    try {
        const reservations = await Reservation.find()
            .populate('flight')
            .sort({ createdAt: -1 })
            .lean(); 
        
        const formattedReservations = reservations.map(resObj => {
            // Calculate seat string
            let seatDisplay = 'N/A';

            
            if (resObj.passengers && resObj.passengers.length > 0) {
                seatDisplay = resObj.passengers.map(p => p.seatNumber).join(', ');
            }

            return {
                ...resObj,
                seatDisplay,
                // Create native JS boolean flags for the statuses
                isConfirmed: resObj.status === 'Confirmed',
                isCancelled: resObj.status === 'Cancelled',
                isPending: resObj.status === 'Pending'
            };
        });

        res.render('reservations', { 
            title: 'My Reservations',
            layout: 'main', 
            reservations: formattedReservations 
        });

    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error loading data');
    }
};

exports.cancelUserReservation = async (req, res) => {
    try {
       
        const { id } = req.params;
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ success: false, message: 'Invalid reservation id' });
        }
        //search for the reservation by ID and populate the flight reference to access its details
        const reservation = await Reservation.findById(id).populate('flight');
        //error handling when reservation is not found or already cancelled
        if (!reservation) {
            return res.status(404).json({ success: false, message: 'Reservation not found' });
        }
        if (reservation.status === 'Cancelled') {
            return res.status(400).json({ success: false, message: 'This reservation is already cancelled' });
        }
        //set the reservation status to 'Cancelled' and save the changes to the database
        reservation.status = 'Cancelled';
        await reservation.save();

        if (reservation.flight) {
            reservation.flight.availableSeats += reservation.passengers.length;
            await reservation.flight.save();
        }

        const seatDisplay = reservation.passengers && reservation.passengers.length > 0
            ? reservation.passengers.map(p => p.seatNumber).join(', ')
            : 'N/A';
        //respond with success, seat display, and status.
        res.status(200).json({
            success: true,
            message: 'Reservation cancelled successfully',
            reservation: {
                ...reservation.toObject(),
                seatDisplay,
                isConfirmed: false,
                isCancelled: true,
                isPending: false
            }
        });
    } catch (err) {

        console.error(err);
        res.status(500).json({ success: false, message: 'Error cancelling reservation' });

    }

};

exports.updateUserReservations = async (req, res) => {
    // Business rule - "A seat may only be assigned to one passenger."

    //get the reservation id from the request parameters and validate it
    try {
        const { id } = req.params;
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ success: false, message: 'Invalid reservation id' });
        }

        const { seatNumber } = req.body; // Can be a string list like "1A, 2B" or an array
        if (!seatNumber || !seatNumber.trim()) {
            return res.status(400).json({ success: false, message: 'A seat selection is required' });
        }

        
        const newSeatsArray = seatNumber.split(',').map(s => s.trim()).filter(Boolean);
        const reservation = await Reservation.findById(id).populate('flight');

        if (!reservation) {
            return res.status(404).json({ success: false, message: 'Reservation not found' });
        }

        // Safety check: the referenced flight may have been deleted by an admin,
        // leaving reservation.flight as null. Bail out before touching flight._id.
        if (!reservation.flight) {
            return res.status(400).json({ success: false, message: 'Flight no longer exists' });
        }

        const passengerCount = reservation.passengers.length;
        if (newSeatsArray.length !== passengerCount) {
            return res.status(400).json({ 
                success: false, 
                message: `Please select exactly ${passengerCount} seats for ${passengerCount} passenger(s).` 
            });
        }

        // Check availability for all selected seats (excluding seats current reservation already holds)
        const currentHeldSeats = reservation.passengers.map(p => p.seatNumber);
        
        for (const seat of newSeatsArray) {
            // Skip checking if passenger is keeping their current seat
            if (currentHeldSeats.includes(seat)) continue;

            const seatTaken = await Reservation.findOne({
                flight: reservation.flight._id,
                status: { $ne: 'Cancelled' },
                _id: { $ne: reservation._id },
                'passengers.seatNumber': seat
            });

            if (seatTaken) {
                return res.status(200).json({ 
                    success: false, 
                    message: `Seat ${seat} is already taken. Please select other seats.` 
                });
            }
        }

        // Map each seat sequentially to your passengers array
        newSeatsArray.forEach((seat, index) => {
            reservation.passengers[index].seatNumber = seat;
        });

        await reservation.save();

        const seatDisplay = reservation.passengers.map(p => p.seatNumber).join(', ');

        res.status(200).json({
            success: true,
            reservation: {
                ...reservation.toObject(),
                seatDisplay,
                isConfirmed: reservation.status === 'Confirmed',
                isCancelled: reservation.status === 'Cancelled',
                isPending: reservation.status === 'Pending'
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Error updating reservation' });
    }
};