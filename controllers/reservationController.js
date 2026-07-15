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

exports.createAdminReservations = async (req, res) => {
    try {
        const {
            reservationNumber, origin, destination, departureTime,
            arrivalTime, seatNumber, totalPrice, status, passengerNames,
            passengerEmails, passengerPassports,
            mealPackage, extraServices
        } = req.body;

        // Look up if a flight already exists with these details
        let flight = await Flight.findOne({ 
            origin, 
            destination, 
            departureDateTime: new Date(departureTime) 
        });
        
        // If no flight exists, create a dummy one so the reference doesn't break
        if (!flight) {
            flight = new Flight({
                flightNumber: 'FL-' + Math.floor(1000 + Math.random() * 9000),
                airline: 'SkyEase Carrier',
                origin, 
                destination,
                departureDateTime: new Date(departureTime),
                arrivalDateTime: new Date(arrivalTime),
                availableSeats: 45, 
                totalSeats: 150,
                ticketPrice: parseFloat(totalPrice.replace(/[^0-9.]/g, '')) || 150
            });
            await flight.save();
        }

        // 3. Clean and prepare passenger data (names, seats, emails, passports) for storage
        const namesArray = passengerNames.split('\n').map(n => n.trim()).filter(n => n.length > 0);
        const seatsArray = seatNumber.split(',').map(s => s.trim());
        const emailsArray = (passengerEmails || '').split('\n').map(e => e.trim()).filter(e => e.length > 0);
        const passportsArray = (passengerPassports || '').split('\n').map(p => p.trim()).filter(p => p.length > 0);

        // 4. Clean and prepare price
        const cleanPrice = parseFloat(totalPrice.replace(/[^0-9.]/g, '')) || 0;

        // 5. set and save data to the Reservation model
        const newReservation = new Reservation({
            reservationNumber,
            flight: flight._id,
            passengers,
            mealPackage,
            extraServices,
            totalPrice: cleanPrice,
            status
        });
        // Save the new reservation to the database and redirect to the admin reservations page
        await newReservation.save(); // Collection becomes visible in Compass here
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
        // prepare data for update
        const {
            reservationNumber, origin, destination, departureTime,
            arrivalTime, seatNumber, totalPrice, status, passengerNames,
            passengerEmails, passengerPassports,
            mealPackage, extraServices
        } = req.body;
        //get the reservation by ID 
        const reservation = await Reservation.findById(id).populate('flight');
        if (!reservation) {
            return res.status(404).json({ success: false, message: 'Reservation not found' });
        }
        // Update flight details if the flight reference exists
        if (reservation.flight) {
            reservation.flight.origin = origin;
            reservation.flight.destination = destination;
            reservation.flight.departureDateTime = new Date(departureTime);
            reservation.flight.arrivalDateTime = new Date(arrivalTime);
            await reservation.flight.save();
        }
        //clean and apply passenger, seat, email, and passport data
        const namesArray = passengerNames.split('\n').map(n => n.trim()).filter(n => n.length > 0);
        const seatsArray = seatNumber.split(',').map(s => s.trim());
        const emailsArray = (passengerEmails || '').split('\n').map(e => e.trim()).filter(e => e.length > 0);
        const passportsArray = (passengerPassports || '').split('\n').map(p => p.trim()).filter(p => p.length > 0);
        const existingPassengers = reservation.passengers || [];
 
 
        const cleanPrice = parseFloat(String(totalPrice).replace(/[^0-9.]/g, '')) || 0;
        // reassign updated values to the reservation object
        reservation.reservationNumber = reservationNumber;
        reservation.passengers = passengers;
        reservation.mealPackage = mealPackage;
        reservation.extraServices = extraServices;
        reservation.totalPrice = cleanPrice;
        reservation.status = status;
        // save the updated reservation
        await reservation.save();

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