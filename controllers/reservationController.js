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