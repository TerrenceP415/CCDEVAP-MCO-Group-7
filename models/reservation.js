const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema(
  {
    reservationNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    flight: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Flight',
      required: true,
    },
    passengers: [
      {
        fullName: { type: String, required: true, trim: true },
        email: { type: String, required: true, trim: true },
        passportNumber: { type: String, required: true, trim: true },
        seatNumber: { type: String, required: true, trim: true },
        contactNumber: { type: String, trim: true, default: '' },
        nationality: { type: String, trim: true, default: '' },
        dateOfBirth: { type: String, trim: true, default: '' },
        gender: { type: String, trim: true, default: '' },
        emergencyContact: { type: String, trim: true, default: '' },
      },
    ],
    mealPackage: {
      type: String,
      trim: true,
    },
    extraServices: {
      type: String,
      trim: true,
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['Pending', 'Confirmed', 'Cancelled'],
      default: 'Pending',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Reservation', reservationSchema);