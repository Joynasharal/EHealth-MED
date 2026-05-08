const express = require('express');
const router = express.Router();
const { getAnalytics, getDashboardStats } = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/dashboard', getDashboardStats);
router.get('/:profileId', getAnalytics);

module.exports = router;
