const AuditLog = require('../models/AuditLog');

/**
 * Log an activity to the audit trail.
 * This function is fire-and-forget — it never throws, so it won't
 * break the main request even if MongoDB is temporarily unavailable.
 *
 * @param {Object} opts
 * @param {string} opts.username  - Name or email of the user performing the action
 * @param {string} opts.userRole  - Role of the user ('admin' or 'passenger')
 * @param {string} opts.activity  - Short description (e.g. "User Login")
 * @param {string} [opts.details] - Optional extra context (e.g. flight number)
 * @param {Array}  [opts.changes] - Optional array of { field, oldValue, newValue } diffs
 */
async function logActivity({ username, userRole, activity, details, changes }) {
  try {
    await AuditLog.create({
      username: username || 'Unknown',
      userRole: userRole || 'Unknown',
      activity,
      details: details || '',
      changes: changes || [],
    });
  } catch (err) {
    // Silent catch — audit logging must never crash the main request
    console.error('Audit log error:', err.message);
  }
}

module.exports = { logActivity };
