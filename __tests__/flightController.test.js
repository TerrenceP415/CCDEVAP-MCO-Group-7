const Flight = require('../models/flight');
const { logActivity } = require('../utils/auditLogger');
const {
  createFlight,
  updateFlight,
  deleteFlight,
} = require('../controllers/flightControllers');
///mock databases
jest.mock('../models/flight');
jest.mock('../utils/auditLogger');

// fake response object for testing controller functions
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

describe('createFlight', () => {
  const baseBody = {
    flightNumber: 'PR101',
    airline: 'Philippine Airlines',
    origin: 'MNL',
    destination: 'LAX',
    departureDateTime: '2026-09-01T08:00',
    arrivalDateTime: '2026-09-01T09:30',
    availableSeats: 100,
    totalSeats: 150,
    ticketPrice: 2500,
  };

  test('creates a flight and redirects on success', async () => {
    Flight.findOne.mockResolvedValue(null); // no duplicate
    const saveMock = jest.fn().mockResolvedValue(true);
    Flight.mockImplementation(() => ({ save: saveMock }));

    const req = { body: baseBody, session: { user: { email: 'admin@skyease.com', role: 'admin' } } };
    const res = mockRes();

    await createFlight(req, res);

    expect(Flight.findOne).toHaveBeenCalledWith({ flightNumber: 'PR101' });
    expect(saveMock).toHaveBeenCalled();
    expect(logActivity).toHaveBeenCalledWith(
      expect.objectContaining({ activity: 'Flight Created' })
    );
    expect(res.redirect).toHaveBeenCalledWith('/admin/flights');
  });

  test('rejects when flight number already exists', async () => {
    Flight.findOne.mockResolvedValue({ flightNumber: 'PR101' });

    const req = { body: baseBody, session: { user: { email: 'admin@skyease.com', role: 'admin' } } };
    const res = mockRes();

    await createFlight(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith('A flight with that number already exists');
  });

  test('rejects when departure is not before arrival', async () => {
    const req = {
      body: { ...baseBody, departureDateTime: '2026-09-01T10:00', arrivalDateTime: '2026-09-01T09:30' },
      session: { user: { email: 'admin@skyease.com', role: 'admin' } },
    };
    const res = mockRes();

    await createFlight(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith('Departure must be before arrival');
  });
});

describe('updateFlight', () => {
  const baseBody = {
    flightNumber: 'PR101',
    airline: 'Philippine Airlines',
    origin: 'MNL',
    destination: 'LAX',
    departureDateTime: '2026-09-01T08:00',
    arrivalDateTime: '2026-09-01T09:30',
    availableSeats: 100,
    totalSeats: 150,
    ticketPrice: 2500,
  };

  test('updates price and available seats for a flight and returns success json', async () => {
    const updatedBody = {
      ...baseBody,
      availableSeats: 80,
      ticketPrice: 3000,
    };

    Flight.findOne.mockResolvedValue(null); // no duplicate
    Flight.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue({ _id: 'abc123', ...baseBody }) });
    Flight.findByIdAndUpdate.mockResolvedValue({ _id: 'abc123', ...updatedBody });

    const req = {
      params: { id: 'abc123' },
      body: updatedBody,
      session: { user: { email: 'admin@skyease.com', role: 'admin' } },
    };
    const res = mockRes();

    await updateFlight(req, res);

    expect(Flight.findByIdAndUpdate).toHaveBeenCalledWith(
      'abc123',
      expect.objectContaining({
        availableSeats: 80,
        ticketPrice: 3000,
      }),
      { returnDocument: 'after', runValidators: true }
    );
    expect(logActivity).toHaveBeenCalledWith(
      expect.objectContaining({ activity: 'Flight Updated' })
    );
    expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Flight updated successfully.' });
  });

  test('returns 400 when required fields are missing', async () => {
    const req = { params: { id: 'abc123' }, body: { flightNumber: 'PR101' }, session: {} };
    const res = mockRes();

    await updateFlight(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false })
    );
    expect(Flight.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  test('returns 404 when flight to update is not found', async () => {
    Flight.findOne.mockResolvedValue(null);
    Flight.findById.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });
    Flight.findByIdAndUpdate.mockResolvedValue(null);

    const req = { params: { id: 'missing' }, body: baseBody, session: {} };
    const res = mockRes();

    await updateFlight(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Flight not found.' });
  });
});

describe('deleteFlight', () => {
  test('deletes a flight and returns success json', async () => {
    Flight.findByIdAndDelete.mockResolvedValue({ _id: 'abc123', flightNumber: 'PR101' });

    const req = { params: { id: 'abc123' }, session: { user: { email: 'admin@skyease.com', role: 'admin' } } };
    const res = mockRes();

    await deleteFlight(req, res);

    expect(Flight.findByIdAndDelete).toHaveBeenCalledWith('abc123');
    expect(logActivity).toHaveBeenCalledWith(
      expect.objectContaining({ activity: 'Flight Deleted' })
    );
    expect(res.json).toHaveBeenCalledWith({ success: true });
  });

  test('returns 404 when flight to delete is not found', async () => {
    Flight.findByIdAndDelete.mockResolvedValue(null);

    const req = { params: { id: 'missing' }, session: {} };
    const res = mockRes();

    await deleteFlight(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Flight not found' });
  });
});