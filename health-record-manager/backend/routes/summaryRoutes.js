const express = require('express');
const router = express.Router();
const { getHealthSummary, getPatientSummary, getDoctorSummary } = require('../controllers/summaryController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/:profileId', getHealthSummary);
router.get('/:profileId/patient', getPatientSummary);
router.get('/:profileId/doctor', getDoctorSummary);

module.exports = router;
