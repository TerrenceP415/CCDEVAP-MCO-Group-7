const Flight = require('../models/flight');
const Reservation = require('../models/reservation');

exports.getStatistics = async () => {
    //get statistics
    const [availableFlights, activeBookings, destinations] = await Promise.all([
        Flight.countDocuments({ availableSeats: { $gt: 0 } }),
        Reservation.countDocuments({ status: { $ne: 'Cancelled' } }),
        Flight.distinct('destination').then((flightDestinations) => flightDestinations.length),
    ]);
    //return statistics as these variables
    return {
        availableFlights,
        activeBookings,
        destinations,
    };
};

exports.getIndexPage = async (req, res) => {
    try {
        const [stats, latestFlight] = await Promise.all([
            exports.getStatistics(),
            //find the latest flight created for suggested flight
            Flight.findOne().sort({ createdAt: -1 }).lean(),
        ]);
        //send over stats and latest flight
        res.render('index', {
            title: 'Home',
            layout: 'main',
            ...stats,
            latestFlight,
        });
    } catch (error) {
        console.error('Error loading homepage statistics:', error);
        res.status(500).send('Server Error loading homepage');
    }
};