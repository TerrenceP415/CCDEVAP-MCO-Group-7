const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');
const { isAuthenticated, requireRole } = require('../middlewares/auth');

// Admin-only audit log viewer
router.get('/audit-log', isAuthenticated, requireRole('admin'), auditController.getAuditLogs);

module.exports = router;
