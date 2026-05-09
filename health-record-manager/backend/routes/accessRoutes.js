const express = require('express');
const router = express.Router();
const {
  lookupUser,
  shareAccess,
  revokeAccess,
  getGrantedAccess,
  getSharedWithMe,
  getSharedProfileRecords,
  getManagedAccount,
  checkAccess,
} = require('../controllers/accessController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/lookup-user', lookupUser);
router.post('/share', shareAccess);
router.delete('/revoke/:id', revokeAccess);
router.get('/granted', getGrantedAccess);
router.get('/shared-with-me', getSharedWithMe);
router.get('/shared-profile/:profileId', getSharedProfileRecords);
router.get('/managed-account/:ownerUserId', getManagedAccount);
router.get('/check/:profileId', checkAccess);
router.get('/received', getSharedWithMe); // backward compat

module.exports = router;
