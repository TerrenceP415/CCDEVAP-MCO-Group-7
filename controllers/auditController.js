const AuditLog = require('../models/AuditLog');

/**
 * GET /admin/audit-log
 * Render the audit trail viewer page for administrators.
 */
exports.getAuditLogs = async (req, res) => {
  try {
    const auditLogs = await AuditLog.find()
      .sort({ timestamp: -1 })
      .lean();

    res.render('admin-audit-log', {
      title: 'Audit Log',
      layout: 'admin',
      auditLogs,
    });
  } catch (err) {
    console.error('Error loading audit logs:', err);
    res.status(500).send('Error loading audit trail');
  }
};
