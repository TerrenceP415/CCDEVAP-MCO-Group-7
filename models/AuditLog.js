const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    default: Date.now,
  },
  username: {
    type: String,
    required: true,
    trim: true,
  },
  userRole: {
    type: String,
    required: true,
    trim: true,
  },
  activity: {
    type: String,
    required: true,
    trim: true,
  },
  details: {
    type: String,
    trim: true,
    default: '',
  },
});

// Index on timestamp for efficient sorting/querying
auditLogSchema.index({ timestamp: -1 });

module.exports = mongoose.models.AuditLog || mongoose.model('AuditLog', auditLogSchema);
