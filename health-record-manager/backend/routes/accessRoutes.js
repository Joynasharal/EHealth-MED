const express = require('express');
const router = express.Router();
const {
  shareAccess,
  revokeAccess,
  getGrantedAccess,
  getSharedWithMe,
  getSharedProfileRecords,
  checkAccess,
} = require('../controllers/accessController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/share', shareAccess);
router.delete('/revoke/:id', revokeAccess);
router.get('/granted', getGrantedAccess);
router.get('/shared-with-me', getSharedWithMe);
router.get('/shared-profile/:profileId', getSharedProfileRecords);
router.get('/check/:profileId', checkAccess);

// Keep backward compat
router.get('/received', getSharedWithMe);

module.exports = router;
