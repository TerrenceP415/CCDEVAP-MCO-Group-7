const express = require('express');
const router = express.Router();
const flightController = require('../controllers/flightController');

router.get('/', flightController.index);
router.get('/new', flightController.newFlightForm);
router.post('/', flightController.createFlight);
router.get('/:id/edit', flightController.editFlightForm);
router.put('/:id', flightController.updateFlight);
router.delete('/:id', flightController.deleteFlight);

module.exports = router;