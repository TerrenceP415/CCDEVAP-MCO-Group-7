const Flight = require('../models/flight');
const Reservation = require('../models/reservation');

exports.getStatistics = async () => {
    const [availableFlights, activeBookings, destinations] = await Promise.all([
        Flight.countDocuments({ availableSeats: { $gt: 0 } }),
        Reservation.countDocuments({ status: { $ne: 'Cancelled' } }),
        Flight.distinct('destination').then((flightDestinations) => flightDestinations.length),
    ]);

    return {
        availableFlights,
        activeBookings,
        destinations,
    };
};

exports.getIndexPage = async (req, res) => {
    try {
        const stats = await exports.getStatistics();

        res.render('index', {
            title: 'Home',
            layout: 'main',
            ...stats,
        });
    } catch (error) {
        console.error('Error loading homepage statistics:', error);
        res.status(500).send('Server Error loading homepage');
    }
};