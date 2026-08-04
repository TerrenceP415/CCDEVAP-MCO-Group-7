const Reservation = require('../models/reservation');
const Flight = require('../models/flight');
const User = require('../models/User');
const { logActivity } = require('../utils/auditLogger');
const {
  createAdminReservations,
  cancelUserReservation,
} = require('../controllers/reservationController');

jest.mock('../models/reservation');
jest.mock('../models/flight');
jest.mock('../models/User');
jest.mock('../utils/auditLogger');

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.redirect = jest.fn().mockReturnValue(res);
  return res;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('createAdminReservations (Create Reservation)', () => {
  const baseBody = {
    reservationNumber: 'RN-001',
    flightNumber: 'PR101',
    seatNumber: '1A',
    totalPrice: '350',
    status: 'Confirmed',
    passengerNames: 'Jane Doe',
    passengerEmails: 'jane@example.com',
    passengerPassports: 'P123456',
    mealPackage: 'Standard Meal',
    extraServices: '',
    userId: '',
  };

  test('creates a reservation, decrements seats, and redirects on success', async () => {
    const flightSave = jest.fn().mockResolvedValue(true);
    const flight = {
      _id: 'flight1',
      flightNumber: 'PR101',
      availableSeats: 5,
      save: flightSave,
    };
    Flight.findOne.mockResolvedValue(flight);

    // No seat conflict on this flight
    Reservation.findOne.mockResolvedValue(null);

    const reservationSave = jest.fn().mockResolvedValue(true);
    Reservation.mockImplementation(() => ({ save: reservationSave }));

    const req = {
      body: baseBody,
      session: { user: { email: 'admin@skyease.com', role: 'admin' } },
    };
    const res = mockRes();

    await createAdminReservations(req, res);

    expect(Flight.findOne).toHaveBeenCalledWith({ flightNumber: 'PR101' });
    expect(reservationSave).toHaveBeenCalled();
    expect(flight.availableSeats).toBe(4); // decremented by 1 passenger
    expect(flightSave).toHaveBeenCalled();
    expect(logActivity).toHaveBeenCalledWith(
      expect.objectContaining({ activity: 'Reservation Created' })
    );
    expect(res.redirect).toHaveBeenCalledWith('/admin/reservations');
  });

  test('rejects reservation when flight number does not exist', async () => {
    Flight.findOne.mockResolvedValue(null);

    const req = {
      body: baseBody,
      session: { user: { email: 'admin@skyease.com', role: 'admin' } },
    };
    const res = mockRes();

    await createAdminReservations(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith(
      expect.stringContaining('No flight found')
    );
  });

  test('rejects reservation when flight has no available seats (business rule)', async () => {
    const flight = { _id: 'flight1', flightNumber: 'PR101', availableSeats: 0, save: jest.fn() };
    Flight.findOne.mockResolvedValue(flight);

    const req = {
      body: baseBody,
      session: { user: { email: 'admin@skyease.com', role: 'admin' } },
    };
    const res = mockRes();

    await createAdminReservations(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith(
      expect.stringContaining('Only 0 seat(s) left')
    );
  });

  test('rejects reservation when selected seat is already taken (business rule)', async () => {
    const flight = { _id: 'flight1', flightNumber: 'PR101', availableSeats: 5, save: jest.fn() };
    Flight.findOne.mockResolvedValue(flight);

    // Simulate an existing reservation already holding seat 1A
    Reservation.findOne.mockResolvedValue({ _id: 'existingRes', passengers: [{ seatNumber: '1A' }] });

    const req = {
      body: baseBody,
      session: { user: { email: 'admin@skyease.com', role: 'admin' } },
    };
    const res = mockRes();

    await createAdminReservations(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith(
      expect.stringContaining('already taken')
    );
  });
});

describe('cancelUserReservation (Cancel Reservation)', () => {
  const validId = '507f1f77bcf86cd799439011';

  test('cancels a reservation, releases the seat, and returns success json', async () => {
    const flightSave = jest.fn().mockResolvedValue(true);
    const reservationSave = jest.fn().mockResolvedValue(true);

    const reservation = {
      _id: validId,
      status: 'Confirmed',
      reservationNumber: 'RN-001',
      passengers: [{ seatNumber: '1A' }],
      flight: { availableSeats: 4, save: flightSave },
      save: reservationSave,
      toObject: function () { return { ...this }; },
    };

    Reservation.findById.mockReturnValue({
      populate: jest.fn().mockResolvedValue(reservation),
    });

    const req = {
      params: { id: validId },
      session: { user: { email: 'jane@example.com', role: 'passenger' } },
    };
    const res = mockRes();

    await cancelUserReservation(req, res);

    expect(reservation.status).toBe('Cancelled');
    expect(reservationSave).toHaveBeenCalled();
    expect(reservation.flight.availableSeats).toBe(5); // seat given back
    expect(flightSave).toHaveBeenCalled();
    expect(logActivity).toHaveBeenCalledWith(
      expect.objectContaining({ activity: 'Reservation Cancelled' })
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true })
    );
  });

  test('returns 404 when reservation is not found', async () => {
    Reservation.findById.mockReturnValue({
      populate: jest.fn().mockResolvedValue(null),
    });

    const req = { params: { id: validId }, session: {} };
    const res = mockRes();

    await cancelUserReservation(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false })
    );
  });

  test('rejects cancelling a reservation that is already cancelled', async () => {
    const reservation = { _id: validId, status: 'Cancelled' };
    Reservation.findById.mockReturnValue({
      populate: jest.fn().mockResolvedValue(reservation),
    });

    const req = { params: { id: validId }, session: {} };
    const res = mockRes();

    await cancelUserReservation(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: expect.stringContaining('already cancelled') })
    );
  });

  test('rejects an invalid reservation id format', async () => {
    const req = { params: { id: 'not-a-valid-id' }, session: {} };
    const res = mockRes();

    await cancelUserReservation(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(Reservation.findById).not.toHaveBeenCalled();
  });
});