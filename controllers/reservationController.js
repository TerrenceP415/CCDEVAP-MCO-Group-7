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
                // Create native JS boolean flags for the statuses
                isConfirmed: resObj.status === 'Confirmed',
                isCancelled: resObj.status === 'Cancelled',
                isPending: resObj.status === 'Pending'
            };
        });

        res.render('admin-reservations', { 
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
            mealPackage, extraServices
        } = req.body;

        // 1. Look up if a flight already exists with these details
        let flight = await Flight.findOne({ 
            origin, 
            destination, 
            departureDateTime: new Date(departureTime) 
        });
        
        // 2. If no flight exists, create a dummy one so the reference doesn't break
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

        // 3. Convert line-separated text area names and comma-separated seats into the structured array your schema expects
        const namesArray = passengerNames.split('\n').map(n => n.trim()).filter(n => n.length > 0);
        const seatsArray = seatNumber.split(',').map(s => s.trim());

        const passengers = namesArray.map((name, index) => ({
            fullName: name,
            email: `${name.toLowerCase().replace(/\s+/g, '')}@skyease.com`,
            passportNumber: 'P' + Math.floor(10000000 + Math.random() * 90000000),
            seatNumber: seatsArray[index] || seatsArray[0] || 'A1' // Fallback if fewer seats typed than names
        }));

        // 4. Strip out any "$" or text strings from the price input to save as a clean number
        const cleanPrice = parseFloat(totalPrice.replace(/[^0-9.]/g, '')) || 0;

        // 5. Build and save your model
        const newReservation = new Reservation({
            reservationNumber,
            flight: flight._id,
            passengers,
            mealPackage,
            extraServices,
            totalPrice: cleanPrice,
            status
        });

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
        //clean and apply passenger and seat data
        const namesArray = passengerNames.split('\n').map(n => n.trim()).filter(n => n.length > 0);
        const seatsArray = seatNumber.split(',').map(s => s.trim());
        const existingPassengers = reservation.passengers || [];
 
        const passengers = namesArray.map((name, index) => {
            const existing = existingPassengers[index];
            return {
                fullName: name,
                email: existing ? existing.email : `${name.toLowerCase().replace(/\s+/g, '')}@skyease.com`,
                passportNumber: existing ? existing.passportNumber : 'P' + Math.floor(10000000 + Math.random() * 90000000),
                seatNumber: seatsArray[index] || seatsArray[0] || 'A1'
            };
        });
 
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
        // TODO(auth): once login/session is implemented, check that the user is the owner of the reservation
        // so a passenger can only cancel their own reservation.  for
        // now since auth isn't implemented yet; this cancels by reservation id ,
        // same as the admin path does, just as a status change instead of a delete.
        const { id } = req.params;
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ success: false, message: 'Invalid reservation id' });
        }
        const reservation = await Reservation.findById(id).populate('flight');

        if (!reservation) {
            return res.status(404).json({ success: false, message: 'Reservation not found' });
        }

        if (reservation.status === 'Cancelled') {

            return res.status(400).json({ success: false, message: 'This reservation is already cancelled' });

        }

        reservation.status = 'Cancelled';
        await reservation.save();


        const seatDisplay = reservation.passengers && reservation.passengers.length > 0
            ? reservation.passengers.map(p => p.seatNumber).join(', ')
            : 'N/A';

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
