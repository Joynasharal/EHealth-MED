const MedicalRecord = require('../models/MedicalRecord');
const FamilyProfile = require('../models/FamilyProfile');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const { getMonthlyVisits } = require('../services/aiSummaryService');

// @desc    Get analytics for a profile
// @route   GET /api/analytics/:profileId
// @access  Private
const getAnalytics = async (req, res, next) => {
  try {
    const { profileId } = req.params;

    const records = await MedicalRecord.find({ profileId, isDeleted: false }).sort({ visitDate: -1 });

    if (!records.length) {
      return successResponse(res, 200, 'No records found', {
        analytics: {
          totalRecords: 0,
          monthlyVisits: [],
          diagnosisDistribution: [],
          hospitalVisits: [],
          recordTypeDistribution: [],
          recentActivity: [],
        },
      });
    }

    // Monthly visits (last 12 months)
    const monthlyVisits = getMonthlyVisits(records);

    // Diagnosis distribution
    const diagnosisMap = {};
    records.forEach((r) => {
      if (r.diagnosis) {
        const key = r.diagnosis.trim().toLowerCase();
        diagnosisMap[key] = (diagnosisMap[key] || 0) + 1;
      }
    });
    const diagnosisDistribution = Object.entries(diagnosisMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, value]) => ({ name, value }));

    // Hospital visits
    const hospitalMap = {};
    records.forEach((r) => {
      if (r.hospitalName) {
        const key = r.hospitalName.trim();
        hospitalMap[key] = (hospitalMap[key] || 0) + 1;
      }
    });
    const hospitalVisits = Object.entries(hospitalMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, visits]) => ({ name, visits }));

    // Record type distribution
    const typeMap = {};
    records.forEach((r) => {
      const key = r.recordType || 'Other';
      typeMap[key] = (typeMap[key] || 0) + 1;
    });
    const recordTypeDistribution = Object.entries(typeMap).map(([name, value]) => ({ name, value }));

    // Recent activity (last 5 records)
    const recentActivity = records.slice(0, 5).map((r) => ({
      _id: r._id,
      doctorName: r.doctorName,
      hospitalName: r.hospitalName,
      diagnosis: r.diagnosis,
      visitDate: r.visitDate,
      recordType: r.recordType,
    }));

    return successResponse(res, 200, 'Analytics fetched', {
      analytics: {
        totalRecords: records.length,
        monthlyVisits,
        diagnosisDistribution,
        hospitalVisits,
        recordTypeDistribution,
        recentActivity,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get dashboard stats for user
// @route   GET /api/analytics/dashboard
// @access  Private
const getDashboardStats = async (req, res, next) => {
  try {
    const profiles = await FamilyProfile.find({
      ownerUserId: req.user._id,
      isActive: true,
    });

    const profileIds = profiles.map((p) => p._id);

    const totalRecords = await MedicalRecord.countDocuments({
      ownerUserId: req.user._id,
      isDeleted: false,
    });

    const recentRecords = await MedicalRecord.find({
      ownerUserId: req.user._id,
      isDeleted: false,
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('profileId', 'profileName relationship');

    // Records this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const recordsThisMonth = await MedicalRecord.countDocuments({
      ownerUserId: req.user._id,
      isDeleted: false,
      createdAt: { $gte: startOfMonth },
    });

    return successResponse(res, 200, 'Dashboard stats fetched', {
      stats: {
        totalRecords,
        totalProfiles: profiles.length,
        recordsThisMonth,
        recentRecords,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAnalytics, getDashboardStats };
