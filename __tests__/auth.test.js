const request = require('supertest');
const { jest } = require('@jest/globals');

jest.mock('../models/User', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  },
}));

const User = require('../models/User');
const app = require('../app');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('authentication flow', () => {
  test('successful registration redirects to login', async () => {
    User.findOne.mockResolvedValueOnce(null);
    User.create.mockResolvedValueOnce({
      _id: 'user-1',
      name: 'Jane Doe',
      email: 'jane@example.com',
    });

    const res = await request(app)
      .post('/register')
      .type('form')
      .send({
        fullName: 'Jane Doe',
        email: 'jane@example.com',
        password: 'secret123',
        passportNumber: 'P12345',
      });

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/login');
  });

  test('successful login creates a session and redirects to profile', async () => {
    User.findOne.mockResolvedValueOnce({
      _id: 'user-1',
      name: 'Jane Doe',
      email: 'jane@example.com',
      password: 'hashed-password',
      role: 'passenger',
      comparePassword: jest.fn().mockResolvedValue(true),
    });

    const agent = request.agent(app);
    const res = await agent
      .post('/login')
      .type('form')
      .send({ email: 'jane@example.com', password: 'secret123' });

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/profile');
  });

  test('failed login redirects back to login with an error', async () => {
    User.findOne.mockResolvedValueOnce({
      _id: 'user-1',
      name: 'Jane Doe',
      email: 'jane@example.com',
      password: 'hashed-password',
      role: 'passenger',
      comparePassword: jest.fn().mockResolvedValue(false),
    });

    const res = await request(app)
      .post('/login')
      .type('form')
      .send({ email: 'jane@example.com', password: 'wrong-password' });

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/login');
  });
});
