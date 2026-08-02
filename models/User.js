// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  passportNumber: { type: String, trim: true },
  role: { type: String, enum: ['passenger', 'admin'], default: 'passenger' },
  createdAt: { type: Date, default: Date.now }
});

UserSchema.virtual('fullName')
  .get(function () {
    return this.name;
  })
  .set(function (v) {
    this.name = v;
  });

UserSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

UserSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

// Reuse model if already compiled (prevents OverwriteModelError)
module.exports = mongoose.models.User || mongoose.model('User', UserSchema);
