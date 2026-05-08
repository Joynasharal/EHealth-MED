const express = require('express');
const router = express.Router();
const { getSharedPatients, getPatientTimeline, doctorUploadRecord } = require('../controllers/doctorController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.use(protect);

router.get('/patients', getSharedPatients);
router.get('/patient/:profileId/timeline', getPatientTimeline);
router.post('/patient/:profileId/upload', upload.single('file'), doctorUploadRecord);

module.exports = router;
