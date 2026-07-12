const Reservation = require('../models/reservation');
const Flight = require('../models/flight');

function getAdminDashboard() {
    return async (req, res) => {
        try {
            // Count total flights
            const [totalFlights, totalBookings] = await Promise.all([
                Flight.countDocuments()
            ]);

            const totalRevenue = await Reservation.aggregate([
                    { $match: { status: 'Confirmed' } },
                    {
                        $lookup: {
                            from: 'flights', // Verify this matches your MongoDB flights collection name
                            localField: 'flightId',
                            foreignField: '_id',
                            as: 'flight'
                        }
                    },
                    { $unwind: '$flight' },
                    { $group: { _id: null, total: { $sum: '$flight.ticketPrice' } } }
                ])
                
            if (totalRevenue.length > 0) {
                totalRevenue = totalRevenue[0].total;
                res.render('admin-dashboard', {
                layout: 'main',
                totalFlights, 
                totalRevenue 
            });
            }
            else {
                totalRevenue = 0;
            }
            
        } catch (err) {
            res.status(500).send('Server Error');
        }
    }
}
