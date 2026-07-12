const Reservation = require('../models/reservation');
const Flight = require('../models/flight');


exports.getAdminReservations = async (req, res) => {
    try {
        const reservations = await Reservation.find()
            .populate('flight')
            .lean();

        const formattedReservations = [];
        // loop through each reservation to format the seat numbers and status flags
        for (let i = 0; i < reservations.length; i++) {
            const reservation = reservations[i];

            // Calculate seat string
            // seat numbers is held as part of passengers array
            // verify passengers array exist, join their seat numbers with a comma; otherwise, display 'N/A'
            let seatDisplay = 'N/A';
            if (reservation.passengers && reservation.passengers.length > 0) {
                const seatNumbers = [];
                for (let j = 0; j < reservation.passengers.length; j++) {
                    seatNumbers.push(reservation.passengers[j].seatNumber);
                }
                seatDisplay = seatNumbers.join(', ');
            }

            formattedReservations.push({
                reservation,
                seatDisplay,
                // Status flag check for button css
                isConfirmed: reservation.status === 'Confirmed',
                isCancelled: reservation.status === 'Cancelled',
                isPending: reservation.status === 'Pending'
            });
        }

        // send the formatted reservations to the view
        res.render('admin-reservations', { title: 'Admin Reservations',
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