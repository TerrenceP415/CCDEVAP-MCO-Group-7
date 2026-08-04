const Flight = require('../models/flight');
const Reservation = require('../models/reservation');
const { logActivity } = require('../utils/auditLogger');
const { processBooking } = require('../controllers/bookingController');

jest.mock('../models/flight');
jest.mock('../models/reservation');
jest.mock('../utils/auditLogger');

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.render = jest.fn().mockReturnValue(res);
  res.redirect = jest.fn().mockReturnValue(res);
  return res;
}

function validPassengerBody(overrides = {}) {
  return {
    fullName: 'Jane Doe',
    email: 'jane@example.com',
    contactNumber: '09171234567',
    passportNumber: 'P123456',
    nationality: 'philippines',
    dateOfBirth: '1995-01-01',
    gender: 'female',
    emergencyContact: '09179876543',
    seatNumber: '1A',
    mealPackage: 'Standard Meal',
    extraServices: '',
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('processBooking business rule validation', () => {
  test('rejects booking when the flight has no available seats', async () => {
    const flight = {
      _id: 'flight1',
      availableSeats: 0,
      ticketPrice: 250,
      toObject: () => ({ _id: 'flight1', availableSeats: 0, ticketPrice: 250 }),
    };
    Flight.findById.mockResolvedValue(flight);
    Reservation.findOne.mockResolvedValue(null); // no seat conflict

    const req = {
      params: { id: 'flight1' },
      body: validPassengerBody(),
      session: {},
      flash: jest.fn(),
    };
    const res = mockRes();

    await processBooking(req, res);

    expect(res.render).toHaveBeenCalledWith(
      'booking',
      expect.objectContaining({
        errors: expect.arrayContaining([
          expect.stringContaining('no available seats'),
        ]),
      })
    );
    // Should never reach seat-decrement / reservation-creation logic
    expect(Flight.findOneAndUpdate).not.toHaveBeenCalled();
    expect(logActivity).not.toHaveBeenCalled();
  });

  test('rejects booking when the selected seat is already taken', async () => {
    const flight = {
      _id: 'flight1',
      availableSeats: 5,
      ticketPrice: 250,
      toObject: () => ({ _id: 'flight1', availableSeats: 5, ticketPrice: 250 }),
    };
    Flight.findById.mockResolvedValue(flight);
    // Simulate seat 1A already booked by someone else
    Reservation.findOne.mockResolvedValue({ _id: 'existingRes', passengers: [{ seatNumber: '1A' }] });

    const req = {
      params: { id: 'flight1' },
      body: validPassengerBody({ seatNumber: '1A' }),
      session: {},
      flash: jest.fn(),
    };
    const res = mockRes();

    await processBooking(req, res);

    expect(res.render).toHaveBeenCalledWith(
      'booking',
      expect.objectContaining({
        errors: expect.arrayContaining([
          expect.stringContaining('already taken'),
        ]),
      })
    );
    expect(Flight.findOneAndUpdate).not.toHaveBeenCalled();
  });

  test('successfully books a flight when a seat is available and unoccupied', async () => {
    const flight = {
      _id: 'flight1',
      availableSeats: 5,
      ticketPrice: 250,
      flightNumber: 'PR101',
    };
    Flight.findById.mockResolvedValue(flight);
    Reservation.findOne.mockResolvedValue(null); // seat is free

    Flight.findOneAndUpdate.mockResolvedValue({ ...flight, availableSeats: 4 });

    const reservationSave = jest.fn().mockResolvedValue(true);
    Reservation.mockImplementation(() => ({ save: reservationSave }));

    const req = {
      params: { id: 'flight1' },
      body: validPassengerBody(),
      session: {},
      flash: jest.fn(),
    };
    const res = mockRes();

    await processBooking(req, res);

    expect(Flight.findOneAndUpdate).toHaveBeenCalled();
    expect(reservationSave).toHaveBeenCalled();
    expect(logActivity).toHaveBeenCalledWith(
      expect.objectContaining({ activity: 'Reservation Created' })
    );
    expect(req.flash).toHaveBeenCalledWith('success', expect.any(String));
    expect(res.redirect).toHaveBeenCalledWith('/my-reservations');
  });

  test('rejects booking when required passenger fields are missing', async () => {
    const flight = {
      _id: 'flight1',
      availableSeats: 5,
      ticketPrice: 250,
      toObject: () => ({ _id: 'flight1', availableSeats: 5, ticketPrice: 250 }),
    };
    Flight.findById.mockResolvedValue(flight);
    Reservation.findOne.mockResolvedValue(null);

    const req = {
      params: { id: 'flight1' },
      body: validPassengerBody({ fullName: '', email: '' }),
      session: {},
      flash: jest.fn(),
    };
    const res = mockRes();

    await processBooking(req, res);

    expect(res.render).toHaveBeenCalledWith(
      'booking',
      expect.objectContaining({
        errors: expect.arrayContaining([
          'Full name is required.',
          'Email address is required.',
        ]),
      })
    );
  });
});