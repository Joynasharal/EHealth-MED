const express = require('express');
const router = express.Router();
const {
  ocrExtract, uploadRecord, getRecords, getRecord,
  updateRecord, deleteRecord, rerunOCR,
} = require('../controllers/recordController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.use(protect);

// OCR-only: upload file, extract structured data, return without saving
router.post('/ocr-extract', upload.single('file'), ocrExtract);

// Save record (with optional file or reference to prior OCR file)
router.post('/upload', upload.single('file'), uploadRecord);

router.get('/detail/:id', getRecord);
router.get('/:profileId', getRecords);
router.put('/:id', updateRecord);
router.delete('/:id', deleteRecord);
router.post('/:id/ocr', upload.single('file'), rerunOCR);

module.exports = router;
